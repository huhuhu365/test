<template>
  <main class="student-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">Student Admin</p>
        <h1>学生管理システム</h1>
        <p class="subtitle">Spring Boot と MySQL のデータを利用し、登録・編集・削除をデータベースへ同期します。</p>
      </div>
      <el-button type="primary" size="large" @click="openCreateDialog">学生を追加</el-button>
    </section>

    <section class="stats-grid" aria-label="学生統計">
      <div class="stat-card">
        <span>学生数</span>
        <strong>{{ students.length }}</strong>
      </div>
      <div class="stat-card">
        <span>平均年齢</span>
        <strong>{{ averageAge || '-' }}</strong>
      </div>
      <div class="stat-card">
        <span>クラス数</span>
        <strong>{{ classCount }}</strong>
      </div>
      <div class="stat-card">
        <span>表示件数</span>
        <strong>{{ filteredStudents.length }}</strong>
      </div>
    </section>

    <section class="toolbar">
      <el-input
        v-model="keyword"
        class="search-input"
        clearable
        placeholder="氏名・電話番号・クラスで検索"
      />
      <el-select v-model="classFilter" class="class-filter" placeholder="すべてのクラス">
        <el-option label="すべてのクラス" value="" />
        <el-option v-for="className in classOptions" :key="className" :label="className" :value="className" />
      </el-select>
      <el-button @click="resetFilters">条件をクリア</el-button>
      <el-button :loading="loading" @click="loadStudents">再読み込み</el-button>
    </section>

    <el-alert
      v-if="errorMessage"
      class="error-alert"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-table
      v-loading="loading"
      :data="filteredStudents"
      class="student-table"
      border
      stripe
      empty-text="学生データがありません"
    >
      <el-table-column type="index" label="#" width="64" />
      <el-table-column prop="name" label="氏名" min-width="120" sortable />
      <el-table-column prop="age" label="年齢" width="100" sortable />
      <el-table-column prop="phone" label="電話番号" min-width="150" />
      <el-table-column prop="className" label="クラス" min-width="130" sortable />
      <el-table-column prop="createdAt" label="登録日時" min-width="170" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" plain @click="openEditDialog(row)">編集</el-button>
          <el-button type="danger" size="small" plain @click="removeStudent(row.id)">削除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="氏名" prop="name">
          <el-input v-model.trim="form.name" maxlength="20" show-word-limit placeholder="氏名を入力してください" />
        </el-form-item>
        <el-form-item label="年齢" prop="age">
          <el-input-number v-model="form.age" :min="6" :max="80" controls-position="right" />
        </el-form-item>
        <el-form-item label="電話番号" prop="phone">
          <el-input v-model.trim="form.phone" maxlength="11" placeholder="11桁の電話番号を入力してください" />
        </el-form-item>
        <el-form-item label="クラス" prop="className">
          <el-input v-model.trim="form.className" maxlength="20" placeholder="例：1年A組" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitStudent">保存</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

interface Student {
  id: number
  name: string
  age: number
  phone: string
  className: string
  createdAt: string
}

type StudentForm = Omit<Student, 'id' | 'createdAt'>

const API_URL = 'http://localhost:8080/api/students'

const students = ref<Student[]>([])
const keyword = ref('')
const classFilter = ref('')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formRef = ref<FormInstance>()

const form = reactive<StudentForm>({
  name: '',
  age: 18,
  phone: '',
  className: ''
})

const rules: FormRules<StudentForm> = {
  name: [{ required: true, message: '氏名を入力してください', trigger: 'blur' }],
  age: [{ required: true, message: '年齢を入力してください', trigger: 'change' }],
  phone: [
    { required: true, message: '電話番号を入力してください', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '正しい11桁の電話番号を入力してください', trigger: 'blur' }
  ],
  className: [{ required: true, message: 'クラスを入力してください', trigger: 'blur' }]
}

const dialogTitle = computed(() => (editingId.value ? '学生情報を編集' : '学生を追加'))

const classOptions = computed(() => {
  return [...new Set(students.value.map((student) => student.className).filter(Boolean))].sort()
})

const filteredStudents = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return students.value.filter((student) => {
    const matchesKeyword =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.phone.includes(query) ||
      student.className.toLowerCase().includes(query)
    const matchesClass = !classFilter.value || student.className === classFilter.value

    return matchesKeyword && matchesClass
  })
})

const averageAge = computed(() => {
  if (!students.value.length) return 0
  const total = students.value.reduce((sum, student) => sum + Number(student.age || 0), 0)
  return Math.round(total / students.value.length)
})

const classCount = computed(() => classOptions.value.length)

onMounted(() => {
  loadStudents()
})

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`リクエストに失敗しました：${response.status}`)
  }

  const text = await response.text()

  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

const loadStudents = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    students.value = await request<Student[]>(API_URL)
  } catch {
    errorMessage.value = 'Spring Boot API に接続できません。バックエンドの起動と MySQL 接続を確認してください。'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (student: Student) => {
  editingId.value = student.id
  Object.assign(form, {
    name: student.name,
    age: student.age,
    phone: student.phone,
    className: student.className
  })
  dialogVisible.value = true
}

const submitStudent = async () => {
  if (!formRef.value) return

  await formRef.value.validate()
  saving.value = true

  try {
    const payload = JSON.stringify(form)

    if (editingId.value) {
      const updatedStudent = await request<Student>(`${API_URL}/${editingId.value}`, {
        method: 'PUT',
        body: payload
      })
      students.value = students.value.map((student) => (student.id === updatedStudent.id ? updatedStudent : student))
      ElMessage.success('学生情報を更新しました')
    } else {
      const createdStudent = await request<Student>(API_URL, {
        method: 'POST',
        body: payload
      })
      students.value.unshift(createdStudent)
      ElMessage.success('学生を登録しました')
    }

    dialogVisible.value = false
  } catch {
    ElMessage.error('保存に失敗しました。API またはデータベース接続を確認してください。')
  } finally {
    saving.value = false
  }
}

const removeStudent = async (id: number) => {
  try {
    await ElMessageBox.confirm('削除すると元に戻せません。この学生を削除しますか？', '削除確認', {
      type: 'warning',
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル'
    })

    await request<void>(`${API_URL}/${id}`, { method: 'DELETE' })
    students.value = students.value.filter((student) => student.id !== id)
    ElMessage.success('学生を削除しました')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('削除に失敗しました。API またはデータベース接続を確認してください。')
    }
  }
}

const resetFilters = () => {
  keyword.value = ''
  classFilter.value = ''
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    age: 18,
    phone: '',
    className: ''
  })
  formRef.value?.clearValidate()
}

const formatDate = (date: string) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}
</script>

<style scoped>
.student-page {
  min-height: 100vh;
  padding: 32px;
  background:
    linear-gradient(135deg, rgba(235, 248, 255, 0.9), rgba(248, 250, 252, 0.9)),
    #f8fafc;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  margin-bottom: 6px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
}

.subtitle {
  margin-top: 8px;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.stat-card span {
  color: #64748b;
  font-size: 14px;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.error-alert {
  margin-bottom: 16px;
}

.search-input {
  max-width: 360px;
}

.class-filter {
  width: 180px;
}

.student-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

:deep(.el-table th.el-table__cell) {
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
}

:deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 900px) {
  .student-page {
    padding: 20px;
  }

  .page-header,
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-input,
  .class-filter {
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 560px) {
  .student-page {
    padding: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 26px;
  }
}
</style>
