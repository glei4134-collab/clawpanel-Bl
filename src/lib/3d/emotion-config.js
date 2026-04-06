/**
 * 情绪配置系统
 * 针对 raccoon_head.glb 模型的 52 种 ARKit 表情优化
 */

export const EMOTIONS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  SURPRISED: 'surprised',
  FEARFUL: 'fearful',
  DISGUSTED: 'disgusted',
  SLEEPY: 'sleepy',
  THINKING: 'thinking',
  CONFUSED: 'confused',
  LOVE: 'love',
  SILLY: 'silly',
  SMIRK: 'smirk'
}

export const emotionConfigs = {
  [EMOTIONS.NEUTRAL]: {
    name: '中性',
    emoji: '😐',
    blendShapes: {},
    transitionTime: 100
  },
  [EMOTIONS.HAPPY]: {
    name: '开心',
    emoji: '😊',
    blendShapes: {
      mouthSmileLeft: 0.8,
      mouthSmileRight: 0.8,
      cheekSquintLeft: 0.6,
      cheekSquintRight: 0.6,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
      browInnerUp: 0.2
    },
    transitionTime: 200
  },
  [EMOTIONS.SAD]: {
    name: '悲伤',
    emoji: '😢',
    blendShapes: {
      browInnerUp: 0.7,
      browOuterUpLeft: 0.5,
      browOuterUpRight: 0.5,
      mouthFrownLeft: 0.6,
      mouthFrownRight: 0.6,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2
    },
    transitionTime: 300
  },
  [EMOTIONS.ANGRY]: {
    name: '愤怒',
    emoji: '😠',
    blendShapes: {
      browDownLeft: 0.9,
      browDownRight: 0.9,
      browInnerUp: 0.3,
      eyeSquintLeft: 0.5,
      eyeSquintRight: 0.5,
      mouthFunnel: 0.4,
      jawOpen: 0.1
    },
    transitionTime: 150
  },
  [EMOTIONS.SURPRISED]: {
    name: '惊讶',
    emoji: '😮',
    blendShapes: {
      browInnerUp: 0.8,
      browOuterUpLeft: 0.6,
      browOuterUpRight: 0.6,
      eyeWideLeft: 0.7,
      eyeWideRight: 0.7,
      jawOpen: 0.5,
      mouthFunnel: 0.3
    },
    transitionTime: 100
  },
  [EMOTIONS.FEARFUL]: {
    name: '恐惧',
    emoji: '😨',
    blendShapes: {
      browInnerUp: 0.9,
      browOuterUpLeft: 0.8,
      browOuterUpRight: 0.8,
      eyeWideLeft: 0.6,
      eyeWideRight: 0.6,
      jawOpen: 0.4,
      mouthFunnel: 0.3
    },
    transitionTime: 200
  },
  [EMOTIONS.DISGUSTED]: {
    name: '厌恶',
    emoji: '😒',
    blendShapes: {
      browDownLeft: 0.4,
      browDownRight: 0.4,
      noseSneerLeft: 0.7,
      noseSneerRight: 0.7,
      cheekSquintLeft: 0.5,
      cheekSquintRight: 0.5,
      mouthPucker: 0.4,
      mouthFunnel: 0.2
    },
    transitionTime: 250
  },
  [EMOTIONS.SLEEPY]: {
    name: '困倦',
    emoji: '😪',
    blendShapes: {
      eyeSquintLeft: 0.8,
      eyeSquintRight: 0.8,
      jawOpen: 0.3,
      browInnerUp: 0.3
    },
    transitionTime: 300
  },
  [EMOTIONS.THINKING]: {
    name: '思考',
    emoji: '🤔',
    blendShapes: {
      browInnerUp: 0.4,
      browOuterUpLeft: 0.3,
      eyeSquintLeft: 0.3,
      jawForward: 0.2,
      mouthPucker: 0.3
    },
    transitionTime: 200
  },
  [EMOTIONS.CONFUSED]: {
    name: '困惑',
    emoji: '😕',
    blendShapes: {
      browInnerUp: 0.5,
      browDownLeft: 0.3,
      browDownRight: 0.3,
      mouthLeft: 0.2,
      mouthRight: 0.2
    },
    transitionTime: 250
  },
  [EMOTIONS.LOVE]: {
    name: '喜欢',
    emoji: '🥰',
    blendShapes: {
      mouthSmileLeft: 0.6,
      mouthSmileRight: 0.6,
      cheekPuff: 0.4,
      eyeSquintLeft: 0.5,
      eyeSquintRight: 0.5,
      browInnerUp: 0.4
    },
    transitionTime: 300
  },
  [EMOTIONS.SILLY]: {
    name: '搞笑',
    emoji: '🤪',
    blendShapes: {
      eyeWideLeft: 0.5,
      eyeWideRight: 0.5,
      mouthFunnel: 0.4,
      jawOpen: 0.3,
      tongueOut: 0.5
    },
    transitionTime: 150
  },
  [EMOTIONS.SMIRK]: {
    name: '得意',
    emoji: '😏',
    blendShapes: {
      mouthSmileRight: 0.6,
      browDownLeft: 0.2,
      browDownRight: 0.4,
      eyeSquintLeft: 0.3,
      noseSneerRight: 0.4
    },
    transitionTime: 200
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
    if (!config) {
      console.log('[EmotionController] 未知情绪:', emotionId)
      return
    }

    const transitionTime = immediate ? 0 : config.transitionTime
    const targetBlendshapes = config.blendShapes

    if (this.mesh.morphTargetInfluences) {
      let appliedCount = 0
      let matchedNames = []

      for (const [blendName, index] of Object.entries(this.mesh.morphTargetDictionary)) {
        let targetValue = 0

        if (blendName in targetBlendshapes) {
          targetValue = targetBlendshapes[blendName]
          matchedNames.push(`${blendName}=${targetValue}`)

          if (immediate) {
            this.mesh.morphTargetInfluences[index] = targetValue
          } else {
            this.animateBlendShape(index, this.mesh.morphTargetInfluences[index], targetValue, transitionTime)
          }

          if (targetValue !== 0) {
            appliedCount++
          }
        }
      }

      if (matchedNames.length > 0) {
        console.log(`[EmotionController] ✅ ${config.name} - 应用 ${appliedCount} 个表情`)
      }
    }

    if (config.animation && this.mixer) {
      this.playAnimation(config.animation)
    }

    this.currentEmotion = emotionId
  }

  animateBlendShape(index, from, to, duration) {
    if (duration === 0 || from === to) {
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
}
