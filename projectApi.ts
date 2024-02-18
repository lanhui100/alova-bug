import { requestAlova } from '..'
import { Project, Pipeline, Remark, Screen, Interview, Offer, Onboard, Probation, ReferenceCheck } from '@/types'

export interface ProjectPaged {
  count: number
  next: string
  previous: string
  results: Project[]
}

export interface PipelinePaged {
  count: number
  next: string
  previous: string
  results: Pipeline[]
}

export const getProjectListApi = (
  status?: number,
  client?: number,
  location?: string,
  page?: number,
  page_size?: number
) =>
  requestAlova.Get<ProjectPaged>('/pro/projects/', {
    params: {
      status,
      client,
      location,
      page,
      page_size
    },
    localCache: 1000 * 60 * 60 * 4,
    hitSource: ['addProject', 'updateProject', 'removeProject']
  })

export const getProjectApi = (id: number) =>
  requestAlova.Get<Project>(`/pro/projects4cdd/${id}/`, {
    localCache: 1000 * 60 * 60 * 24 * 10,
    hitSource: ['updateProject', 'removeProject', 'addContactPerson', 'updateContactPerson', 'removeContactPerson']
  })

export const updateProjectApi = (id: number, data: Project) =>
  requestAlova.Patch<Project>(`/pro/projects4cdd/${id}/`, data, {
    name: 'updateProject'
  })

export const updateProShortApi = (id: number, data: Partial<Project>) =>
  requestAlova.Patch<Project>(`/pro/projects4cdd/${id}/`, data, {
    name: 'updateProject'
  })
export const addProjectApi = (data: Project) =>
  requestAlova.Post<Project>('/pro/projects4cdd/', data, {
    name: 'addProject'
  })

// 获取pipelines，带pro或者cdd详情的
export const getPipelinePlusApi = (
  pro?: number,
  cdd?: number,
  with_pro?: boolean,
  page?: number,
  page_size?: number,
  active_only?: boolean
) =>
  requestAlova.Get(with_pro ? '/pro/pipelines_pro/' : '/pro/pipelines_cdd/', {
    params: {
      page,
      page_size,
      pro,
      cdd
    },
    localCache: 1000 * 60 * 60 * 24 * 10,
    name: 'getPipelinePlus',
    hitSource: [
      'updatePipeline',
      'removePipeline',
      'addPipeline',
      'addEvent',
      'updateEvent',
      'addRemark',
      'updateRemark',
      'removeRemark',
      'updateBasic',
      'updateContact'
    ],
    transformData(data: PipelinePaged) {
      data.results.forEach((obj) => {
        const steps = { probations: 5, onboards: 4, reference_checks: 3, offers: 2, interviews: 1, screens: 0 }
        const step = Object.keys(steps).find((key) => obj[key] && obj[key].length > 0) ?? 'screens'
        const status =
          obj[step] && obj[step].length > 0
            ? obj[step].reduce((max, item) => Math.max(max, item.status), obj[step][0].status)
            : 0
        obj['current_step'] = steps[step]
        obj['current_status'] = status
      })
      return data
    }
  })

// 获取单个pipeline
export const getPipelineApi = (id: number, with_pro?: boolean) =>
  requestAlova.Get(with_pro ? `/pro/pipelines_pro/${id}/` : `/pro/pipelines_cdd/${id}/`, {
    localCache: 1000 * 60 * 60 * 24 * 10,
    hitSource: ['updatePipeline', 'removePipeline', 'addEvent', 'updateEvent'],
    transformData(data: Pipeline) {
      const steps = { probations: 5, onboards: 4, reference_checks: 3, offers: 2, interviews: 1, screens: 0 }
      const step = Object.keys(steps).find((key) => data[key] && data[key].length > 0) ?? 'screens'
      const status =
        data[step] && data[step].length > 0
          ? data[step].reduce((max, item) => Math.max(max, item.status), data[step][0].status)
          : 0
      data['current_step'] = steps[step]
      data['current_status'] = status
      return data
    }
  })

export const removePipelineApi = (id: number) =>
  requestAlova.Delete(`/pro/pipelines/${id}/`, {
    name: 'removePipeline'
  })

// 更新pipeline，带pro或cdd详情的
export const updatePipelinePlusApi = (id: number, data: Pipeline, is_pro?: boolean) =>
  requestAlova.Patch(is_pro ? `/pro/pipelines_pro/${id}/` : `/pro/pipelines_cdd/${id}/`, data, {
    name: 'updatePipeline',
    transformData(data: Pipeline) {
      const steps = { probations: 5, onboards: 4, reference_checks: 3, offers: 2, interviews: 1, screens: 0 }
      const step = Object.keys(steps).find((key) => data[key] && data[key].length > 0) ?? 'screens'
      const status =
        data[step] && data[step].length > 0
          ? data[step].reduce((max, item) => Math.max(max, item.status), data[step][0].status)
          : 0
      data['current_step'] = steps[step]
      data['current_status'] = status
      return data
    }
  })

// 新增pipeline
export const addPipelineApi = (data: Pipeline) =>
  requestAlova.Post<Pipeline>('/pro/pipelines/', data, {
    name: 'addPipeline'
  })

// 补丁更新pipeline
export const updatePipelineApi = (id: number, data: Pipeline) =>
  requestAlova.Patch<Pipeline>(`/pro/pipelines/${id}/`, data, { name: 'updatePipeline' })

// 新增Remark
export const addRemarkApi = (data: Remark) => requestAlova.Post<Remark>(`/pro/remarks/`, data, { name: 'addRemark' })
export const updateRemarkApi = (id: number, data: Remark) =>
  requestAlova.Patch<Remark>(`pro/remarks/${id}/`, data, { name: 'updateRemark' })
export const removeRemarkApi = (id: number) => requestAlova.Delete(`/pro/remarks/${id}/`, { name: 'removeRemark' })

// screnn
export const addScreenApi = (data: Screen) =>
  requestAlova.Post<Screen>(`/pro/screens/`, data, {
    name: 'addEvent'
  })
export const updateScreenApi = (id: number, data: Screen) =>
  requestAlova.Patch<Screen>(`pro/screens/${id}/`, data, { name: 'updateEvent' })

// interview
export const addInterviewApi = (data: Interview) =>
  requestAlova.Post<Interview>(`/pro/interviews/`, data, {
    name: 'addEvent'
  })
export const updateInterviewApi = (id: number, data: Interview) =>
  requestAlova.Patch<Interview>(`/pro/interviews/${id}/`, data, { name: 'updateEvent' })

// offer
export const addOfferApi = (data: Offer) =>
  requestAlova.Post<Offer>(`/pro/offers/`, data, {
    name: 'addEvent'
  })
export const updateOfferApi = (id: number, data: Offer) =>
  requestAlova.Patch<Offer>(`/pro/offers/${id}/`, data, { name: 'updateEvent' })

// reference_check
export const addReferenceCheckApi = (data: ReferenceCheck) =>
  requestAlova.Post<ReferenceCheck>(`/pro/reference_checks/`, data, {
    name: 'addEvent'
  })
export const updateReferenceCheckApi = (id: number, data: ReferenceCheck) =>
  requestAlova.Patch<ReferenceCheck>(`/pro/reference_checks/${id}/`, data, { name: 'updateEvent' })

// onbord
export const addOnboardApi = (data: Onboard) =>
  requestAlova.Post<Onboard>(`/pro/onboards/`, data, {
    name: 'addEvent'
  })
export const updateOnboardApi = (id: number, data: Onboard) =>
  requestAlova.Patch<Onboard>(`/pro/onboards/${id}/`, data, { name: 'updateEvent' })

// probation
export const addProbationApi = (data: Probation) =>
  requestAlova.Post<Probation>(`/pro/probations/`, data, {
    name: 'addEvent'
  })
export const updateProbationApi = (id: number, data: Probation) =>
  requestAlova.Patch<Probation>(`/pro/probations/${id}/`, data, { name: 'updateEvent' })
