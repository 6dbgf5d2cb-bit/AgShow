import { createRoute, updateRoute, getRouteById, SeasonOptions, TagOptions, TravelRoute } from '../../utils/travel'
import { getCurrentSession, checkModulePermission } from '../../utils/user'
import { ensureCloudMediaUrl, ensureCloudMediaUrls } from '../../utils/cloud-storage'

interface OptionWithState {
  value: string
  label: string
  selected: boolean
}

Page({
  data: {
    routeId: '',
    title: '',
    description: '',
    startPoint: '',
    endPoint: '',
    waypointsText: '',
    distance: '',
    duration: '',
    maxParticipants: '',
    difficulty: 'medium',
    selectedSeasons: [] as string[],
    selectedTags: [] as string[],
    seasonOptionsWithState: [] as OptionWithState[],
    tagOptionsWithState: [] as OptionWithState[],
    tips: '',
    coverImage: '',
    images: [] as string[],
    loading: false,
    errorMessage: '',
    isEdit: false
  },

  onLoad(options: any) {
    this.initOptions()
    
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const hasPermission = checkModulePermission(session.userId, 'travel', options.id ? 'edit' : 'create')
    if (!hasPermission) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    if (options.id) {
      this.loadRouteData(options.id)
    }
  },

  initOptions() {
    const seasonOptionsWithState = SeasonOptions.map(item => ({
      value: item.value,
      label: item.label,
      selected: false
    }))

    const tagOptionsWithState = TagOptions.map(item => ({
      value: item,
      label: item,
      selected: false
    }))

    this.setData({
      seasonOptionsWithState,
      tagOptionsWithState
    })
  },

  loadRouteData(routeId: string) {
    const route = getRouteById(routeId)
    if (route) {
      const selectedSeasons = route.bestSeason || []
      const selectedTags = route.tags || []

      const seasonOptionsWithState = SeasonOptions.map(item => ({
        value: item.value,
        label: item.label,
        selected: selectedSeasons.includes(item.value)
      }))

      const tagOptionsWithState = TagOptions.map(item => ({
        value: item,
        label: item,
        selected: selectedTags.includes(item)
      }))

      this.setData({
        routeId: route.routeId,
        title: route.title,
        description: route.description,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        waypointsText: route.waypoints.join('\n'),
        distance: route.distance.toString(),
        duration: route.duration.toString(),
        maxParticipants: route.maxParticipants.toString(),
        difficulty: route.difficulty,
        selectedSeasons: selectedSeasons,
        selectedTags: selectedTags,
        seasonOptionsWithState,
        tagOptionsWithState,
        tips: route.tips,
        coverImage: route.coverImage,
        images: route.images || [],
        isEdit: true
      })
    }
  },

  onInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value,
      errorMessage: ''
    })
  },

  onWaypointsInput(e: any) {
    this.setData({
      waypointsText: e.detail.value
    })
  },

  selectDifficulty(e: any) {
    this.setData({
      difficulty: e.currentTarget.dataset.value
    })
  },

  toggleSeason(e: any) {
    const value = e.currentTarget.dataset.value
    const { seasonOptionsWithState, selectedSeasons } = this.data
    
    const newOptions = seasonOptionsWithState.map(item => {
      if (item.value === value) {
        return { ...item, selected: !item.selected }
      }
      return item
    })

    const newSelectedSeasons = newOptions
      .filter(item => item.selected)
      .map(item => item.value)

    this.setData({
      seasonOptionsWithState: newOptions,
      selectedSeasons: newSelectedSeasons
    })
  },

  toggleTag(e: any) {
    const value = e.currentTarget.dataset.value
    const { tagOptionsWithState, selectedTags } = this.data
    
    const newOptions = tagOptionsWithState.map(item => {
      if (item.value === value) {
        return { ...item, selected: !item.selected }
      }
      return item
    })

    const newSelectedTags = newOptions
      .filter(item => item.selected)
      .map(item => item.value)

    this.setData({
      tagOptionsWithState: newOptions,
      selectedTags: newSelectedTags
    })
  },

  validateForm(): boolean {
    const { title, description, startPoint, endPoint } = this.data

    if (!title.trim()) {
      this.setData({ errorMessage: '请输入线路名称' })
      return false
    }

    if (!description.trim()) {
      this.setData({ errorMessage: '请输入线路描述' })
      return false
    }

    if (!startPoint.trim()) {
      this.setData({ errorMessage: '请输入起点' })
      return false
    }

    if (!endPoint.trim()) {
      this.setData({ errorMessage: '请输入终点' })
      return false
    }

    return true
  },

  async onSubmit() {
    if (!this.validateForm()) return

    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true, errorMessage: '' })
    wx.showLoading({ title: '上传图片中', mask: true })

    try {
      const coverImage = this.data.coverImage
        ? await ensureCloudMediaUrl(this.data.coverImage, 'travel/covers')
        : ''
      const images = await ensureCloudMediaUrls(this.data.images, 'travel/images')

      const waypoints = this.data.waypointsText
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w)

      const routeData = {
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        startPoint: this.data.startPoint.trim(),
        endPoint: this.data.endPoint.trim(),
        waypoints: waypoints,
        distance: parseFloat(this.data.distance) || 0,
        duration: parseFloat(this.data.duration) || 0,
        maxParticipants: parseInt(this.data.maxParticipants) || 10,
        difficulty: this.data.difficulty as 'easy' | 'medium' | 'hard',
        bestSeason: this.data.selectedSeasons,
        tags: this.data.selectedTags,
        tips: this.data.tips.trim(),
        coverImage,
        images
      }

      if (this.data.isEdit) {
        updateRoute(this.data.routeId, routeData)
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 1500
        })
      } else {
        createRoute(session.userId, routeData)
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 1500
        })
      }

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error: any) {
      this.setData({
        errorMessage: error.message || '发布失败',
        loading: false
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  chooseCoverImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          coverImage: tempFilePath
        })
      }
    })
  },

  chooseImages() {
    const remainingCount = 9 - this.data.images.length
    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      }
    })
  },

  deleteImage(e: any) {
    const index = e.currentTarget.dataset.index
    const { images } = this.data
    images.splice(index, 1)
    this.setData({ images })
  },

  goBack() {
    wx.navigateBack()
  }
})