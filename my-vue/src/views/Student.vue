<template>
  <main class="student-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">Student Admin</p>
        <h1>学生管理系统</h1>
        <p class="subtitle">集中维护学生姓名、年龄、手机号和班级信息，数据会自动保存在当前浏览器。</p>
      </div>
      <el-button type="primary" size="large" @click="openCreateDialog">新增学生</el-button>
    </section>

    <section class="stats-grid" aria-label="学生统计">
      <div class="stat-card">
        <span>学生总数</span>
        <strong>{{ students.length }}</strong>
      </div>
      <div class="stat-card">
        <span>平均年龄</span>
        <strong>{{ averageAge || '-' }}</strong>
      </div>
      <div class="stat-card">
        <span>班级数量</span>
        <strong>{{ classCount }}</strong>
      </div>
      <div class="stat-card">
        <span>当前结果</span>
        <strong>{{ filteredStudents.length }}</strong>
      </div>
    </section>

    <section class="toolbar">
      <el-input
        v-model="keyword"
        class="search-input"
        clearable
        placeholder="搜索姓名、手机号或班级"
      />
      <el-select v-model="classFilter" class="class-filter" placeholder="全部班级">
        <el-option label="全部班级" value="" />
        <el-option v-for="className in classOptions" :key="className" :label="className" :value="className" />
      </el-select>
      <el-button @click="resetFilters">重置筛选</el-button>
    </section>

    <el-table
      :data="filteredStudents"
      class="student-table"
      border
      stripe
      empty-text="暂无学生数据"
    >
      <el-table-column type="index" label="#" width="64" />
      <el-table-column prop="name" label="姓名" min-width="120" sortable />
      <el-table-column prop="age" label="年龄" width="100" sortable />
      <el-table-column prop="phone" label="手机号" min-width="150" />
      <el-table-column prop="className" label="班级" min-width="130" sortable />
      <el-table-column prop="createdAt" label="录入时间" min-width="170" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" plain @click="openEditDialog(row)">编辑</el-button>
          <el-button type="danger" size="small" plain @click="removeStudent(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="86px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model.trim="form.name" maxlength="20" show-word-limit placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="6" :max="80" controls-position="right" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="form.phone" maxlength="11" placeholder="请输入 11 位手机号" />
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model.trim="form.className" maxlength="20" placeholder="例如：三年级一班" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStudent">保存</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

interface Student {
  id: string
  name: string
  age: number
  phone: string
  className: string
  createdAt: string
}

type StudentForm = Omit<Student, 'id' | 'createdAt'>

const STORAGE_KEY = 'students'

const students = ref<Student[]>([])
const keyword = ref('')
const classFilter = ref('')
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<StudentForm>({
  name: '',
  age: 18,
  phone: '',
  className: ''
})

const rules: FormRules<StudentForm> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }]
}

const dialogTitle = computed(() => (editingId.value ? '编辑学生' : '新增学生'))

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

watch(
  students,
  () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students.value))
  },
  { deep: true }
)

const loadStudents = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    students.value = rawData ? normalizeStudents(JSON.parse(rawData)) : []
  } catch {
    students.value = []
    localStorage.removeItem(STORAGE_KEY)
    ElMessage.warning('本地学生数据异常，已自动清空')
  }
}

const normalizeStudents = (data: unknown): Student[] => {
  if (!Array.isArray(data)) return []

  return data
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const student = item as Partial<Student>
      return {
        id: student.id || crypto.randomUUID(),
        name: student.name || '',
        age: Number(student.age) || 18,
        phone: student.phone || '',
        className: student.className || '未分班',
        createdAt: student.createdAt || new Date().toISOString()
      }
    })
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

  if (editingId.value) {
    const index = students.value.findIndex((student) => student.id === editingId.value)
    if (index !== -1) {
      const currentStudent = students.value[index]
      if (!currentStudent) return

      students.value[index] = {
        id: currentStudent.id,
        createdAt: currentStudent.createdAt,
        name: form.name,
        age: form.age,
        phone: form.phone,
        className: form.className
      }
      ElMessage.success('学生信息已更新')
    }
  } else {
    students.value.unshift({
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString()
    })
    ElMessage.success('学生已添加')
  }

  dialogVisible.value = false
}

const removeStudent = async (id: string) => {
  await ElMessageBox.confirm('删除后无法恢复，确定要删除这名学生吗？', '确认删除', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })

  students.value = students.value.filter((student) => student.id !== id)
  ElMessage.success('学生已删除')
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
  return new Intl.DateTimeFormat('zh-CN', {
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
