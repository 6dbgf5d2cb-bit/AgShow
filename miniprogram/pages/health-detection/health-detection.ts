import { getCurrentSession } from '../../utils/user'
import {
  generateBaZi,
  analyzeSymptoms,
  SYMPTOM_CATEGORIES,
  SYMPTOMS,
  getTimeSlots,
  TimeSlot,
  SymptomItem
} from '../../utils/health'

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
    activeTab: 'bazi',
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
    const tab = options?.tab === 'bazi' ? 'bazi' : 'symptom'
    const slots = getTimeSlots()
    this.setData({
      activeTab: tab,
      timeSlots: slots,
      currentSymptoms: SYMPTOMS.filter(s => s.category === 'head')
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

  switchTab(e: any) {
    console.log('switchTab called', e)
    const tab = e.currentTarget.dataset.tab
    console.log('switchTab tab:', tab)
    this.setData({
      activeTab: tab
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
      
      const storageKey = `bazi_result_${Date.now()}`
      wx.setStorageSync(storageKey, result)
      wx.navigateTo({
        url: `/pages/health-result/health-result?type=bazi&key=${storageKey}`
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

  submitSymptom() {
    const { selectedSymptoms } = this.data

    if (selectedSymptoms.length === 0) {
      wx.showToast({ title: '请至少选择一项症状', icon: 'none' })
      return
    }

    wx.showLoading({ title: '辨证分析中...' })

    try {
      const result = analyzeSymptoms(selectedSymptoms)
      wx.hideLoading()
      const storageKey = `symptom_result_${Date.now()}`
      wx.setStorageSync(storageKey, result)
      wx.navigateTo({
        url: `/pages/health-result/health-result?type=symptom&key=${storageKey}`
      })
    } catch (error: any) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '分析失败', icon: 'none' })
    }
  }
})