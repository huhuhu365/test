<template>
  <div style="padding: 20px">

    <h2>学生管理系统</h2>

    <!-- 表单 -->
    <el-form :inline="true">
      <el-form-item label="姓名">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="年龄">
        <el-input v-model="form.age" />
      </el-form-item>

      <el-form-item label="电话">
        <el-input v-model="form.phone" />
      </el-form-item>

      <el-button type="primary" @click="addStudent">添加</el-button>
    </el-form>

    <!-- 表格 -->
    <el-table :data="students" style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="age" label="年龄" />
      <el-table-column prop="phone" label="电话" />

      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="danger" size="small" @click="remove(scope.$index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const form = ref({
  name: '',
  age: '',
  phone: ''
})

const students = ref([])

// 初始化
onMounted(() => {
  const data = localStorage.getItem('students')
  if (data) students.value = JSON.parse(data)
})

// 添加
const addStudent = () => {
  if (!form.value.name) return

  students.value.push({
    name: form.value.name,
    age: form.value.age,
    phone: form.value.phone
  })

  save()
  form.value = { name: '', age: '', phone: '' }
}

// 删除
const remove = (index) => {
  students.value.splice(index, 1)
  save()
}

// 保存
const save = () => {
  localStorage.setItem('students', JSON.stringify(students.value))
}
</script>