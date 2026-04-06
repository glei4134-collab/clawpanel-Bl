/**
 * 情绪配置系统
 * 支持 ARKit 52种表情 + 标准表情映射
 */

export const EMOTIONS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  SURPRISED: 'surprised',
  FEARFUL: 'fearful',
  DISGUSTED: 'disgusted'
}

export const emotionConfigs = {
  [EMOTIONS.NEUTRAL]: {
    name: '中性',
    emoji: '😐',
    blendShapes: {},
    animation: null,
    transitionTime: 100
  },
  [EMOTIONS.HAPPY]: {
    name: '开心',
    emoji: '😊',
    blendShapes: {
      browInnerUp: 0.2,
      mouthSmile: 0.8,
      cheekSquintLeft: 0.6,
      cheekSquintRight: 0.6,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4
    },
    animation: null,
    transitionTime: 200
  },
  [EMOTIONS.SAD]: {
    name: '悲伤',
    emoji: '😢',
    blendShapes: {
      browInnerUp: 0.5,
      browOuterUpLeft: 0.3,
      browOuterUpRight: 0.3,
      eyeLookDown: 0.3,
      mouthFrown: 0.6,
      jawOpen: 0.1
    },
    animation: null,
    transitionTime: 300
  },
  [EMOTIONS.ANGRY]: {
    name: '愤怒',
    emoji: '😠',
    blendShapes: {
      browInnerUp: 0.3,
      browDownLeft: 0.8,
      browDownRight: 0.8,
      eyeSquintLeft: 0.5,
      eyeSquintRight: 0.5,
      mouthFunnel: 0.3,
      jawForward: 0.1
    },
    animation: null,
    transitionTime: 150
  },
  [EMOTIONS.SURPRISED]: {
    name: '惊讶',
    emoji: '😮',
    blendShapes: {
      browInnerUp: 0.7,
      browOuterUpLeft: 0.5,
      browOuterUpRight: 0.5,
      eyeWideLeft: 0.6,
      eyeWideRight: 0.6,
      jawOpen: 0.5,
      mouthFunnel: 0.3
    },
    animation: null,
    transitionTime: 100
  },
  [EMOTIONS.FEARFUL]: {
    name: '恐惧',
    emoji: '😨',
    blendShapes: {
      browInnerUp: 0.8,
      browOuterUpLeft: 0.7,
      browOuterUpRight: 0.7,
      eyeWideLeft: 0.5,
      eyeWideRight: 0.5,
      jawOpen: 0.4,
      mouthFunnel: 0.4
    },
    animation: null,
    transitionTime: 200
  },
  [EMOTIONS.DISGUSTED]: {
    name: '厌恶',
    emoji: '😒',
    blendShapes: {
      browDownLeft: 0.3,
      browDownRight: 0.3,
      noseSneerLeft: 0.6,
      noseSneerRight: 0.6,
      mouthFunnel: 0.5,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3
    },
    animation: null,
    transitionTime: 250
  }
}

export const emotionList = Object.entries(emotionConfigs).map(([key, config]) => ({
  id: key,
  name: config.name,
  emoji: config.emoji
}))

export class EmotionController {
  constructor(mesh) {
    this.mesh = mesh
    this.mixer = null
    this.currentEmotion = EMOTIONS.NEUTRAL
    this.currentAction = null
    this.supportedBlendShapes = new Set()

    if (mesh.morphTargetDictionary) {
      Object.keys(mesh.morphTargetDictionary).forEach(key => {
        this.supportedBlendShapes.add(key)
      })
    }
  }

  setMixer(mixer) {
    this.mixer = mixer
  }

  applyEmotion(emotionId, immediate = false) {
    const config = emotionConfigs[emotionId]
    console.log('[EmotionController] applyEmotion:', emotionId, config ? '配置存在' : '配置不存在')
    if (!config) {
      console.log('[EmotionController] 可用的情绪配置:', Object.keys(emotionConfigs))
      return
    }

    const transitionTime = immediate ? 0 : config.transitionTime
    const targetBlendshapes = config.blendShapes

    console.log('[EmotionController] 设置表情:', config.name, '目标blendShapes:', targetBlendshapes)
    console.log('[EmotionController] mesh.morphTargetInfluences:', this.mesh.morphTargetInfluences ? '存在' : '不存在')
    console.log('[EmotionController] mesh.morphTargetDictionary:', this.mesh.morphTargetDictionary)

    if (this.mesh.morphTargetInfluences) {
      let appliedCount = 0
      for (let i = 0; i < this.mesh.morphTargetInfluences.length; i++) {
        const targetName = this.mesh.morphTargetDictionary?.[i]
        let targetValue = 0

        if (targetBlendshapes && targetBlendshapes[targetName] !== undefined) {
          targetValue = targetBlendshapes[targetName]
        } else if (this.isFallbackBlendShape(targetName, targetBlendshapes)) {
          targetValue = this.getFallbackValue(targetName, targetBlendshapes)
        }

        if (immediate) {
          this.mesh.morphTargetInfluences[i] = targetValue
        } else {
          this.animateBlendShape(i, this.mesh.morphTargetInfluences[i], targetValue, transitionTime)
        }
        if (targetValue > 0) {
          appliedCount++
          console.log(`[EmotionController] 应用 blendShape[${i}] ${targetName} = ${targetValue}`)
        }
      }
      console.log(`[EmotionController] 共应用了 ${appliedCount} 个 blendShape`)
    } else {
      console.log('[EmotionController] mesh 没有 morphTargetInfluences，无法应用表情')
    }

    if (config.animation && this.mixer) {
      this.playAnimation(config.animation)
    }

    this.currentEmotion = emotionId
  }

  isFallbackBlendShape(name, targetBlendshapes) {
    if (!targetBlendshapes) return false

    const fallbacks = {
      'mouthSmile': ['mouthSmileLeft', 'mouthSmileRight', 'mouth Smile', 'Smile'],
      'mouthFrown': ['mouthFrownLeft', 'mouthFrownRight', 'mouthFrown', 'Frown'],
      'browDownLeft': ['browDown_L', 'browDownLeft', 'LeftBrowDown'],
      'browDownRight': ['browDown_R', 'browDownRight', 'RightBrowDown'],
      'browInnerUp': ['browInnerUp', 'InnerBrowUp', 'Inner_Brow_Up'],
      'browOuterUpLeft': ['browOuterUpLeft', 'OuterBrowUp_L'],
      'browOuterUpRight': ['browOuterUpRight', 'OuterBrowUp_R'],
      'eyeWideLeft': ['eyeWideLeft', 'eyeWide_Left', 'WideLeft'],
      'eyeWideRight': ['eyeWideRight', 'eyeWide_Right', 'WideRight'],
      'eyeSquintLeft': ['eyeSquintLeft', 'eyeSquint_Left', 'SquintLeft'],
      'eyeSquintRight': ['eyeSquintRight', 'eyeSquint_Right', 'SquintRight'],
      'cheekSquintLeft': ['cheekSquintLeft', 'cheekPuffLeft', 'LeftCheekPuff'],
      'cheekSquintRight': ['cheekSquintRight', 'cheekPuffRight', 'RightCheekPuff'],
      'noseSneerLeft': ['noseSneerLeft', 'NoseSneerLeft'],
      'noseSneerRight': ['noseSneerRight', 'NoseSneerRight'],
      'mouthFunnel': ['mouthFunnel', 'mouthFunnel', 'Funnel'],
      'jawOpen': ['jawOpen', 'Jaw_Open', 'MouthOpen']
    }

    for (const [mainName, aliases] of Object.entries(fallbacks)) {
      if (aliases.includes(name) && targetBlendshapes[mainName] !== undefined) {
        return true
      }
    }
    return false
  }

  getFallbackValue(name, targetBlendshapes) {
    const fallbacks = {
      'mouthSmile': ['mouthSmileLeft', 'mouthSmileRight', 'mouth Smile', 'Smile'],
      'mouthFrown': ['mouthFrownLeft', 'mouthFrownRight', 'mouthFrown', 'Frown'],
      'browDownLeft': ['browDown_L', 'browDownLeft', 'LeftBrowDown'],
      'browDownRight': ['browDown_R', 'browDownRight', 'RightBrowDown'],
      'browInnerUp': ['browInnerUp', 'InnerBrowUp', 'Inner_Brow_Up'],
      'eyeWideLeft': ['eyeWideLeft', 'eyeWide_Left', 'WideLeft'],
      'eyeWideRight': ['eyeWideRight', 'eyeWide_Right', 'WideRight'],
      'eyeSquintLeft': ['eyeSquintLeft', 'eyeSquint_Left', 'SquintLeft'],
      'eyeSquintRight': ['eyeSquintRight', 'eyeSquint_Right', 'SquintRight'],
      'cheekSquintLeft': ['cheekSquintLeft', 'cheekPuffLeft', 'LeftCheekPuff'],
      'cheekSquintRight': ['cheekSquintRight', 'cheekPuffRight', 'RightCheekPuff'],
      'noseSneerLeft': ['noseSneerLeft', 'NoseSneerLeft'],
      'noseSneerRight': ['noseSneerRight', 'NoseSneerRight'],
      'mouthFunnel': ['mouthFunnel', 'mouthFunnel', 'Funnel'],
      'jawOpen': ['jawOpen', 'Jaw_Open', 'MouthOpen']
    }

    for (const [mainName, aliases] of Object.entries(fallbacks)) {
      if (aliases.includes(name) && targetBlendshapes[mainName] !== undefined) {
        return targetBlendshapes[mainName]
      }
    }
    return 0
  }

  animateBlendShape(index, from, to, duration) {
    if (duration === 0) {
      this.mesh.morphTargetInfluences[index] = to
      return
    }

    const startTime = performance.now()
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = this.easeInOutCubic(progress)
      this.mesh.morphTargetInfluences[index] = from + (to - from) * eased

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }

  playAnimation(animationName) {
    if (!this.mixer) return

    if (this.currentAction) {
      this.currentAction.fadeOut(0.3)
    }

    const clips = this.mixer._actions.map(a => a._clip)
    const clip = clips.find(c => c.name === animationName)

    if (clip) {
      this.currentAction = this.mixer.clipAction(clip)
      this.currentAction.reset().fadeIn(0.3).play()
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  reset() {
    this.applyEmotion(EMOTIONS.NEUTRAL, true)
  }

  getSupportedExpressions() {
    return Array.from(this.supportedBlendShapes)
  }

  logAvailableBlendShapes() {
    console.log('[EmotionController] 支持的表情列表:', Array.from(this.supportedBlendShapes))
  }
}
