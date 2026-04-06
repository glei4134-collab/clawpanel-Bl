/**
 * 3D模型优化工具
 * 负责Draco压缩、LOD、纹理优化等功能
 */

export class ModelOptimizer {
  constructor() {
    this.isMobile = this.detectMobile()
    this.maxVertices = this.isMobile ? 20000 : 50000
    this.textureSize = this.isMobile ? 512 : 1024
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  getOptimizationSettings() {
    return {
      enableDraco: true,
      enableLOD: !this.isMobile,
      maxVertices: this.maxVertices,
      textureSize: this.textureSize,
      enableCompression: true,
      disableShadows: true,
      antialias: !this.isMobile,
      pixelRatio: Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2)
    }
  }

  optimizeMesh(mesh) {
    if (mesh.geometry) {
      mesh.geometry.computeBoundingSphere()
      mesh.geometry.computeBoundingBox()
    }
    mesh.castShadow = false
    mesh.receiveShadow = false
    return mesh
  }

  disposeModel(model) {
    model.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}

export const modelOptimizer = new ModelOptimizer()
