import { createLog, canPublishLog, getLogById, updateLog, TravelLog } from '../../utils/travellog'
import { getCurrentSession } from '../../utils/user'
import { ensureCloudMediaUrls } from '../../utils/cloud-storage'

Page({
  data: {
    title: '',
    content: '',
    images: [] as string[],
    videos: [] as string[],
    tags: '',
    location: '',
    allowComments: true,
    loading: false,
    errorMessage: '',
    isEdit: false,
    logId: ''
  },

  onLoad(options: { logId?: string }) {
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    const result = canPublishLog(session.userId)
    if (!result.canPublish) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    if (options?.logId) {
      this.setData({ isEdit: true, logId: options.logId })
      this.loadLog(options.logId)
    }
  },

  loadLog(logId: string) {
    const log = getLogById(logId)
    if (log) {
      this.setData({
        title: log.title,
        content: log.content,
        images: log.images || [],
        videos: log.videos || [],
        tags: log.tags ? log.tags.join(',') : '',
        location: log.location || '',
        allowComments: log.allowComments
      })
    }
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value })
  },

  onContentInput(event: { detail: { value: string } }) {
    this.setData({ content: event.detail.value })
  },

  onTagsInput(event: { detail: { value: string } }) {
    this.setData({ tags: event.detail.value })
  },

  onLocationInput(event: { detail: { value: string } }) {
    this.setData({ location: event.detail.value })
  },

  onAllowCommentsChange() {
    this.setData({ allowComments: !this.data.allowComments })
  },

  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFilePaths]
        })
      }
    })
  },

  chooseVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: (res) => {
        if (this.data.videos.length < 3) {
          this.setData({
            videos: [...this.data.videos, res.tempFilePath]
          })
        } else {
          wx.showToast({
            title: '最多只能上传3个视频',
            icon: 'none'
          })
        }
      }
    })
  },

  removeImage(event: { currentTarget: { dataset: { index: number } } }) {
    const index = event.currentTarget.dataset.index
    const newImages = this.data.images.filter((_, i) => i !== index)
    this.setData({ images: newImages })
  },

  removeVideo(event: { currentTarget: { dataset: { index: number } } }) {
    const index = event.currentTarget.dataset.index
    const newVideos = this.data.videos.filter((_, i) => i !== index)
    this.setData({ videos: newVideos })
  },

  validateForm(): boolean {
    if (!this.data.title.trim()) {
      this.setData({ errorMessage: '请输入标题' })
      return false
    }

    if (this.data.title.length > 50) {
      this.setData({ errorMessage: '标题长度不能超过50个字符' })
      return false
    }

    if (!this.data.content.trim()) {
      this.setData({ errorMessage: '请输入内容' })
      return false
    }

    if (this.data.content.length > 5000) {
      this.setData({ errorMessage: '内容长度不能超过5000个字符' })
      return false
    }

    return true
  },

  async onPublish() {
    console.log('onPublish: starting')
    
    if (!this.validateForm()) {
      console.log('onPublish: validation failed')
      return
    }

    const session = getCurrentSession()
    if (!session) {
      console.log('onPublish: no session')
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true, errorMessage: '' })
    wx.showLoading({ title: '上传媒体中', mask: true })

    try {
      const images = await ensureCloudMediaUrls(this.data.images, 'travellog/images')
      const videos = await ensureCloudMediaUrls(this.data.videos, 'travellog/videos')

      const tagArray = this.data.tags.split(',').map(t => t.trim()).filter(t => t)

      if (this.data.isEdit) {
        const result = await updateLog(this.data.logId, {
          title: this.data.title.trim(),
          content: this.data.content.trim(),
          images,
          videos,
          tags: tagArray,
          location: this.data.location.trim() || undefined,
          allowComments: this.data.allowComments,
          updateTime: Date.now()
        })

        if (result) {
          wx.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 1500
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          this.setData({ errorMessage: '更新失败，请重试', loading: false })
        }
      } else {
        const result = await createLog(session.userId, {
          title: this.data.title.trim(),
          content: this.data.content.trim(),
          images,
          videos,
          tags: tagArray,
          location: this.data.location.trim() || undefined,
          allowComments: this.data.allowComments
        })

        if (result) {
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 1500
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          this.setData({ errorMessage: '发布失败，请重试', loading: false })
        }
      }
    } catch (error: any) {
      this.setData({
        errorMessage: error.message || '操作失败',
        loading: false
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})