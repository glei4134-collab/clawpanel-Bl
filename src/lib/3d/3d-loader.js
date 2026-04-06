/**
 * 3D模型加载器
 * 负责GLB/GLTF模型加载、Draco压缩支持、场景初始化
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { modelOptimizer } from './model-optimizer.js'
import { EmotionController } from './emotion-config.js'

export class AvatarLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
    this.currentModel = null
    this.emotionController = null
    this.mixer = null
    this.clock = new THREE.Clock()
    this.loadTimeout = null
  }

  async loadModel(url, options = {}) {
    const { timeout = 120000, onProgress } = options

    return new Promise((resolve, reject) => {
      let timeoutId = null

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        reject(new Error(`模型加载超时 (${timeout / 1000}秒)，文件可能太大`))
      }, timeout)

      this.gltfLoader.load(
        url,
        (gltf) => {
          cleanup()
          console.log('[AvatarLoader] 模型加载成功:', url)
          console.log('[AvatarLoader] 模型信息:', {
            meshes: gltf.scene.children.length,
            animations: gltf.animations?.length || 0,
            cameras: gltf.cameras?.length || 0
          })

          try {
            const model = gltf.scene
            const settings = modelOptimizer.getOptimizationSettings()

            model.traverse((child) => {
              if (child.isMesh) {
                modelOptimizer.optimizeMesh(child)
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => new THREE.MeshStandardMaterial({
                      color: m.color || new THREE.Color(0xcccccc),
                      map: m.map,
                      roughness: m.roughness ?? 0.5,
                      metalness: m.metalness ?? 0.1
                    }))
                  } else {
                    child.material = new THREE.MeshStandardMaterial({
                      color: child.material.color || new THREE.Color(0xcccccc),
                      map: child.material.map,
                      roughness: child.material.roughness ?? 0.5,
                      metalness: child.material.metalness ?? 0.1
                    })
                  }
                }
              }
            })

            if (gltf.animations && gltf.animations.length > 0) {
              console.log('[AvatarLoader] 发现动画:', gltf.animations.map(a => a.name))
              this.mixer = new THREE.AnimationMixer(model)
              gltf.animations.forEach((clip) => {
                this.mixer.clipAction(clip).play()
              })
            }

            const faceMesh = this.findFaceMesh(model)
            if (faceMesh && faceMesh !== model) {
              console.log('[AvatarLoader] 找到面部网格，支持情绪表情')
              this.emotionController = new EmotionController(faceMesh)
              if (this.mixer) {
                this.emotionController.setMixer(this.mixer)
              }
            } else {
              console.log('[AvatarLoader] 未找到面部网格，情绪表情功能不可用')
            }

            this.currentModel = model
            resolve({
              model,
              mixer: this.mixer,
              emotionController: this.emotionController
            })
          } catch (parseError) {
            reject(new Error(`模型解析失败: ${parseError.message}`))
          }
        },
        (progress) => {
          if (onProgress && progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            onProgress(percent, progress.loaded, progress.total)
          }
        },
        (error) => {
          cleanup()
          console.error('[AvatarLoader] 模型加载错误:', error)
          let errorMsg = '模型加载失败'
          if (error.message) {
            errorMsg = error.message
          }
          if (error.status === 404) {
            errorMsg = '模型文件不存在'
          } else if (error.status === 0) {
            errorMsg = '网络错误或文件路径无效'
          }
          reject(new Error(errorMsg))
        }
      )
    })
  }

  findFaceMesh(model) {
    let faceMesh = null
    let allMeshes = []

    model.traverse((child) => {
      if (child.isMesh) {
        allMeshes.push(child.name || child.type)
        if (!faceMesh) {
          if (
            child.morphTargetInfluences &&
            child.morphTargetInfluences.length > 0
          ) {
            faceMesh = child
            console.log('[AvatarLoader] 找到表情网格:', child.name, '有', child.morphTargetInfluences.length, '个表情')
            console.log('[AvatarLoader] 表情名称:', Object.keys(child.morphTargetDictionary || {}))
          }
        }
      }
    })

    console.log('[AvatarLoader] 所有网格:', allMeshes)

    if (faceMesh) {
      return faceMesh
    }

    if (allMeshes.length > 0) {
      console.log('[AvatarLoader] 未找到带表情的网格，使用第一个网格')
      const firstMesh = model.getObjectByName(allMeshes[0]) ||
        model.children.find(c => c.isMesh)
      return firstMesh || model
    }

    return model
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }
  }

  dispose() {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout)
    }
    if (this.currentModel) {
      modelOptimizer.disposeModel(this.currentModel)
      this.currentModel = null
    }
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
    this.emotionController = null
  }
}

export class AvatarScene {
  constructor(container) {
    this.container = container
    this.loader = new AvatarLoader()
    this.scene = null
    this.camera = null
    this.renderer = null
    this.animationId = null
    this.isInitialized = false
    this.clock = new THREE.Clock()
  }

  init() {
    if (this.isInitialized) return

    const width = this.container.clientWidth || 400
    const height = this.container.clientHeight || 400

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    this.camera.position.set(0, 1.5, 3)

    const settings = modelOptimizer.getOptimizationSettings()
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(settings.pixelRatio)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(2, 4, 3)
    this.scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-2, 1, -2)
    this.scene.add(fillLight)

    this.addControls()
    this.startAnimationLoop()

    this.isInitialized = true
    this.handleResize()
    window.addEventListener('resize', () => this.handleResize())
  }

  addControls() {
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let rotationY = 0
    let rotationX = 0

    this.container.addEventListener('mousedown', (e) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    })

    this.container.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.loader.currentModel) return

      const deltaX = e.clientX - previousMousePosition.x
      const deltaY = e.clientY - previousMousePosition.y

      rotationY += deltaX * 0.01
      rotationX += deltaY * 0.01
      rotationX = Math.max(-0.5, Math.min(0.5, rotationX))

      this.loader.currentModel.rotation.y = rotationY
      this.loader.currentModel.rotation.x = rotationX

      previousMousePosition = { x: e.clientX, y: e.clientY }
    })

    this.container.addEventListener('mouseup', () => {
      isDragging = false
    })

    this.container.addEventListener('mouseleave', () => {
      isDragging = false
    })

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault()
      const zoomSpeed = 0.001
      const delta = e.deltaY * zoomSpeed
      this.camera.position.z = Math.max(1.5, Math.min(5, this.camera.position.z + delta))
    })
  }

  startAnimationLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      const deltaTime = this.clock.getDelta()
      this.loader.update(deltaTime)
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
    }
  }

  async loadAvatar(modelPath = '/models/avatar.glb', options = {}) {
    try {
      console.log('[AvatarScene] 开始加载模型:', modelPath)
      const result = await this.loader.loadModel(modelPath, {
        timeout: options.timeout || 120000,
        onProgress: options.onProgress
      })

      this.centerModel(result.model)
      this.scene.add(result.model)
      console.log('[AvatarScene] 模型已添加到场景')
      return result
    } catch (error) {
      console.error('[AvatarScene] 加载模型失败:', error)
      throw error
    }
  }

  centerModel(model) {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    model.position.x = -center.x
    model.position.y = -box.min.y
    model.position.z = -center.z

    const maxDim = Math.max(size.x, size.y, size.z)
    const minDim = Math.min(size.x, size.y, size.z)

    const containerWidth = this.container.clientWidth || 400
    const containerHeight = this.container.clientHeight || 400
    const aspect = containerWidth / containerHeight

    const fov = this.camera.fov * (Math.PI / 180)
    const distanceForHeight = (size.y / 2) / Math.tan(fov / 2)
    const distanceForWidth = (size.x / 2) / Math.tan(fov / 2) / aspect
    const distance = Math.max(distanceForHeight, distanceForWidth) * 1.5

    this.camera.position.set(0, size.y * 0.4, distance)
    this.camera.lookAt(0, size.y * 0.3, 0)
  }

  setEmotion(emotionId) {
    console.log('[AvatarScene] setEmotion 被调用:', emotionId)
    if (this.loader.emotionController) {
      console.log('[AvatarScene] emotionController 存在，应用表情')
      this.loader.emotionController.applyEmotion(emotionId)
    } else {
      console.log('[AvatarScene] emotionController 不存在!')
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.loader.dispose()
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
    }
    window.removeEventListener('resize', () => this.handleResize())
    this.isInitialized = false
  }
}
