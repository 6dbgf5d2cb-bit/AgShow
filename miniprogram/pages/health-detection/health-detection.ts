import {
  generateBaZi,
  analyzeSymptoms,
  SYMPTOM_CATEGORIES,
  SYMPTOMS,
  getTimeSlots,
  TimeSlot,
  SymptomItem
} from '../../utils/health'
import {
  getHealthUsageStats,
  incrementTcmUsage,
  incrementBaziUsage,
  saveHealthSharePayloadAsync
} from '../../utils/health-usage'

interface BaziForm {
  name: string
  gender: string
  calendarType: string
  birthDate: string
  birthTime: string
  birthTimeLabel: string
}

Page({
  data: {
    activeTab: 'symptom' as 'bazi' | 'symptom',
    pageTitle: '中医诊断',
    tcmUsageCount: 0,
    baziUsageCount: 0,
    baziForm: {
      name: '',
      gender: '',
      calendarType: 'solar',
      birthDate: '',
      birthTime: '',
      birthTimeLabel: ''
    },
    timeSlots: [] as TimeSlot[],
    symptomCategories: SYMPTOM_CATEGORIES,
    selectedCategory: 'head',
    selectedSymptoms: [] as string[],
    selectedCount: 0,
    currentSymptoms: [] as SymptomItem[]
  },

  onLoad(options: { tab?: string }) {
    const tab: 'bazi' | 'symptom' = options?.tab === 'bazi' ? 'bazi' : 'symptom'
    const slots = getTimeSlots()
    this.setData({
      activeTab: tab,
      pageTitle: tab === 'bazi' ? '四柱八字' : '中医诊断',
      timeSlots: slots,
      currentSymptoms: SYMPTOMS.filter((s) => s.category === 'head')
    })
    this.refreshUsageStats()
  },

  onShow() {
    this.refreshUsageStats()
  },

  refreshUsageStats() {
    const stats = getHealthUsageStats()
    this.setData({
      tcmUsageCount: stats.tcm,
      baziUsageCount: stats.bazi
    })
  },

  goBack() {
    wx.navigateBack()
  },

  selectCalendarType(e: any) {
    const value = e.currentTarget.dataset.value
    const { baziForm } = this.data
    this.setData({
      baziForm: {
        ...baziForm,
        calendarType: value
      }
    })
  },

  onBaziInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    const { baziForm } = this.data
    this.setData({
      baziForm: {
        ...baziForm,
        [field]: e.detail.value
      }
    })
  },

  selectGender(e: any) {
    const value = e.currentTarget.dataset.value
    const { baziForm } = this.data
    this.setData({
      baziForm: {
        ...baziForm,
        gender: value
      }
    })
  },

  onBirthDateChange(e: any) {
    const { baziForm } = this.data
    this.setData({
      baziForm: {
        ...baziForm,
        birthDate: e.detail.value
      }
    })
  },

  onBirthTimeChange(e: any) {
    const index = e.detail.value
    const { timeSlots, baziForm } = this.data
    const slot = timeSlots[index]
    this.setData({
      baziForm: {
        ...baziForm,
        birthTime: slot.value,
        birthTimeLabel: slot.label
      }
    })
  },

  async submitBazi() {
    const { baziForm } = this.data
    
    if (!baziForm.name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return
    }
    
    if (!baziForm.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }
    
    if (!baziForm.birthDate) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      })
      return
    }
    
    if (!baziForm.birthTime) {
      wx.showToast({
        title: '请选择出生时间',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({
      title: '排盘中...'
    })
    
    try {
      const result = await generateBaZi(
        baziForm.name,
        baziForm.birthDate,
        baziForm.birthTime,
        baziForm.gender,
        baziForm.calendarType
      )
      
      wx.hideLoading()

      incrementBaziUsage()
      this.refreshUsageStats()
      const shareId = await saveHealthSharePayloadAsync(
        'bazi',
        result,
        `${baziForm.name.trim()}的八字排盘`
      )
      wx.navigateTo({
        url: `/pages/health-result/health-result?type=bazi&shareId=${encodeURIComponent(shareId)}`
      })
    } catch (error: any) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '排盘失败',
        icon: 'none'
      })
    }
  },

  selectCategory(e: any) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category,
      currentSymptoms: SYMPTOMS.filter(s => s.category === category)
    })
  },

  toggleSymptom(e: any) {
    const id = e.currentTarget.dataset.id
    const { selectedSymptoms } = this.data
    let next: string[]

    if (selectedSymptoms.includes(id)) {
      next = selectedSymptoms.filter((s) => s !== id)
    } else {
      next = [...selectedSymptoms, id]
    }

    this.setData({
      selectedSymptoms: next,
      selectedCount: next.length
    })
  },

  async submitSymptom() {
    const { selectedSymptoms } = this.data

    if (selectedSymptoms.length === 0) {
      wx.showToast({ title: '请至少选择一项症状', icon: 'none' })
      return
    }

    wx.showLoading({ title: '辨证分析中...' })

    try {
      const result = analyzeSymptoms(selectedSymptoms)
      wx.hideLoading()
      incrementTcmUsage()
      this.refreshUsageStats()
      const title = result.patternSummary
        ? `中医诊断 · ${result.patternSummary.slice(0, 24)}`
        : '中医诊断结果'
      const shareId = await saveHealthSharePayloadAsync('symptom', result, title)
      wx.navigateTo({
        url: `/pages/health-result/health-result?type=symptom&shareId=${encodeURIComponent(shareId)}`
      })
    } catch (error: any) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '分析失败', icon: 'none' })
    }
  }
})