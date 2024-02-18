<template>
  <div v-if="loading">
    <el-skeleton :row="5" animation />
  </div>
  <div v-else-if="error">
    <el-result icon="error" title="错误" sub-title="error" />
  </div>
  <div v-else>
    <div flex justify-end mb-1 v-if="data?.length > 0">
      <SlideUpTransition>
        <el-button
          type="primary"
          size="small"
          :icon="Refresh"
          plain
          @click="showOngoingProOnly = false"
          v-if="showOngoingProOnly"
          >全部</el-button
        >
        <el-button type="success" size="small" :icon="Finished" plain @click="showOngoingProOnly = true" v-else
          >进行中</el-button
        >
      </SlideUpTransition>
    </div>
    <!-- <div flex justify-end mb-1>
      <el-text size="small" tag="i" type="info">仅显示进行中</el-text>
      <el-switch :loading="loading" ml-2 size="small" v-model="showOngoingProOnly" />
    </div> -->
    <el-table
      width="100%"
      :height="height"
      :data="data"
      size="default"
      table-layout="auto"
      :default-sort="{ prop: 'status', order: 'ascending' }"
      @row-click="gotoDetail"
    >
      <el-table-column
        label="状态"
        prop="status"
        sortable
        :sort-by="['status', 'start_date']"
        :filters="[
          { text: '进行中', value: '进行中' },
          { text: '暂停', value: '暂停' },
          { text: '停止', value: '停止' },
          { text: '成功', value: '成功' }
        ]"
        :filter-method="filterStatusHandler"
      >
        <template #default="scope">
          <el-tag effect="dark" :type="getTagType(scope.row.status)" round size="small">{{
            scope.row.full_status
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed label="职位">
        <template #default="scope">
          <div class="position">
            <el-icon>
              <Briefcase />
            </el-icon>
            <span ml-1>{{ scope.row.position }}</span>
            <el-tag
              size="small"
              :type="getTagProcessColor(scope.row.created, scope.row.end_date, scope.row.target_days, scope.row.status)"
              round
              ml-1
              >{{ getDaysDiff(scope.row.created, scope.row.end_date) }}天</el-tag
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-if="client === undefined && userStore.role !== 0"
        label="公司"
        :filters="filtersClient"
        :filter-method="filterClientHandler"
      >
        <template #default="scope">
          <div flex items-center>
            <el-icon>
              <GobletSquareFull />
            </el-icon>
            <span ml-1>{{ scope.row.client_name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="所属部门">
        <template #default="scope">
          <el-popover trigger="hover" placement="top" width="auto" effect="dark">
            <span text-3>{{ scope.row.org_fullnames }}</span>
            <template #reference>
              {{ scope.row.org_name }}
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="地点" :filters="filtersLocation" :filter-method="filterLocationHandler">
        <template #default="scope">
          <span>{{ locationHandler(scope.row.location) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="年薪范围">
        <template #default="scope">
          <span>{{ getPackageRange(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目负责" prop="owner" v-if="userStore.role !== 2" />
      <el-table-column label="开始日期" prop="created" sortable :formatter="dateFormatter" />
    </el-table>
    <el-pagination
      mt-2
      :small="true"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :page-sizes="[1, 2, 3, 10]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    />
  </div>
  <pre>{{ error }}</pre>
  <span
    >totle:{{ total }}, page:{{ page }}, pageSize:{{ pageSize }}, isLastPage:{{ isLastPage }}, pageCount:{{
      pageCount
    }}</span
  >
  <pre>{{ data }}</pre>
</template>
<script setup lang="ts">
  import { onUnmounted, ref, watch } from 'vue'
  import { Briefcase, GobletSquareFull, Finished, Refresh } from '@element-plus/icons-vue'
  import { useRouter } from 'vue-router'
  import { useWatcher, useFetcher } from 'alova'
  import { usePagination } from '@alova/scene-vue'
  import { getProjectListApi, type ProjectPaged } from '@/api'
  import { Project } from '@/types'
  import { dayjs, type TableColumnCtx } from 'element-plus'
  import { useProjectStatusTag, useTools } from '@/utils'
  import { useMyUserStore } from '@/stores'
  import eventBus from '@/utils/eventBus'

  const router = useRouter()
  const userStore = useMyUserStore()
  const props = defineProps(['client', 'height'])
  const client = props.client
  const height = props.height ? props.height : 500
  const showOngoingProOnly = ref(false)
  const status = ref<number>()

  const location = ref<string>()

  const getPackageRange = (pro: Project) => {
    if (pro.package_min || pro.package_max) {
      return `${pro.package_min} - ${pro.package_max}万`
    } else {
      return '-'
    }
  }

  const { data, isLastPage, page, pageSize, pageCount, total, loading, error, onError, onSuccess } = usePagination(
    (page, pageSize) => getProjectListApi(status.value, client, location.value, page, pageSize),
    {
      total: (response) => response.count,
      data: (response: ProjectPaged) => response.results,
      initialData: {
        total: 0,
        data: []
      },
      initialPage: 1,
      initialPageSize: 10
    }
  )

  // const { data, loading, error, onSuccess, onError } = useWatcher(
  //   () => getProjectListApi(status.value, client, location.value, page.value, pageSize.value),
  //   [showOngoingProOnly, page, pageSize],
  //   { immediate: true }
  // )
  const { fetch } = useFetcher({ force: true })
  onError((e) => {
    console.log(e.error)
  })
  onSuccess(() => {
    if (data.value.length !== 0) {
      filtersClient.value = [...new Set(data.value.results.map((obj) => obj.client_name))].map((client) => ({
        text: client,
        value: client
      }))
      filtersLocation.value = [...new Set(data.value.results.map((obj) => obj.location))].map((location) => ({
        text: location,
        value: location
      }))
    }
  })

  watch(
    () => showOngoingProOnly.value,
    () => {
      status.value = showOngoingProOnly.value ? 0 : undefined
      page.value = 1
    }
  )
  const updateProList = () => fetch(getProjectListApi(status.value, client, location.value, page.value, pageSize.value))
  eventBus.on('updateProList', updateProList)
  onUnmounted(() => eventBus.off('updateProList', updateProList))

  const { getDaysDiff, getTagProcessColor } = useProjectStatusTag()
  const { locationHandler } = useTools()
  const filtersClient = ref([])
  const filtersLocation = ref([])

  const filterStatusHandler = (value: string, row: Project) => row.full_status === value
  const filterClientHandler = (value: string, row: Project) => row.client_name === value
  const filterLocationHandler = (value: string, row: Project) => row.location === value

  const getTagType = (status: number) => {
    const tagType = {
      0: 'warning',
      1: 'primary',
      2: 'info',
      3: 'success'
    }
    return tagType[status]
  }

  const dateFormatter = (row: Project, column: TableColumnCtx<Project>) => {
    return dayjs(row.created).format('YYYY-MM-DD')
  }
  const gotoDetail = (row: Project) => {
    router.push({ path: `/pipeline/project/${row.id}` })
  }
</script>
<style scoped>
  .position:hover {
    cursor: pointer;
    color: var(--el-color-danger-dark-2);
  }
</style>
