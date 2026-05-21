/**
 * Custom fal-compatible Provider.
 *
 * This is the extension point for user-supplied video APIs. It works with
 * fal queue-compatible gateways such as Yunwu by letting the UI provide
 * baseUrl, auth mode, and model paths at runtime.
 */

import { FalAIProvider } from './fal-ai'
import type { Model, MediaType, ProviderConfig } from './types'

type CustomAuthType = 'key' | 'bearer' | 'x-api-key' | 'none'

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readAuthType(value: unknown): CustomAuthType {
  if (value === 'bearer' || value === 'x-api-key' || value === 'none') {
    return value
  }
  return 'key'
}

export class CustomProvider extends FalAIProvider {
  readonly name = 'custom'
  readonly displayName = '自定义接口'

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: (config.baseUrl || 'https://yunwu.ai').replace(/\/+$/, ''),
    })
  }

  protected getAuthHeaders(): Record<string, string> {
    const apiKey = this.config.apiKey?.trim()
    const authType = readAuthType(this.config.extra?.authType)

    if (!apiKey || authType === 'none') {
      return {}
    }

    if (authType === 'bearer') {
      return { Authorization: `Bearer ${apiKey}` }
    }

    if (authType === 'x-api-key') {
      return { 'x-api-key': apiKey }
    }

    return { Authorization: `Key ${apiKey}` }
  }

  async listModels(mediaType?: MediaType): Promise<Model[]> {
    const imageModel = readString(this.config.extra?.imageModel)
    const videoModel = readString(this.config.extra?.videoModel) ?? 'fal-ai/veo3'

    const models: Model[] = [
      ...(imageModel
        ? [{
            id: imageModel,
            name: '自定义图片模型',
            description: '来自设置页的自定义图片模型路径',
            modes: ['text-to-image' as const, 'image-to-image' as const],
            mediaType: 'image' as const,
            provider: this.name,
          }]
        : []),
      {
        id: videoModel,
        name: '自定义视频模型',
        description: '来自设置页的自定义视频模型路径',
        modes: ['text-to-video', 'image-to-video'],
        mediaType: 'video',
        provider: this.name,
      },
    ]

    return mediaType ? models.filter((model) => model.mediaType === mediaType) : models
  }
}
