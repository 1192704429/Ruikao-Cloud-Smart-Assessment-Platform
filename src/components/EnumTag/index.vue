<template>
  <el-tag v-if="displayLabel !== null && displayLabel !== undefined && displayLabel !== ''" :type="tagType" size="small">
    {{ displayLabel }}
  </el-tag>
  <span v-else>-</span>
</template>

<script>
const TAG_TYPE_PRESETS = {
  enable: { 1: 'success', 0: 'danger' },
  normal: { 1: 'success', 0: 'danger' },
  exam: { 5: 'info', 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: 'info' },
  paper: { 0: 'info', 1: 'success', 2: 'warning' },
  gender: { 0: 'info', 1: 'success', 2: 'warning' },
  questionType: { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger', 5: 'info' }
}

export default {
  name: 'EnumTag',
  props: {
    value: {
      type: [Number, String, Boolean],
      default: null
    },
    labelMap: {
      type: Object,
      default: () => ({})
    },
    preset: {
      type: String,
      default: ''
    },
    typeMap: {
      type: Object,
      default: null
    }
  },
  computed: {
    displayLabel() {
      if (this.labelMap[this.value] !== undefined) {
        return this.labelMap[this.value]
      }
      return this.value
    },
    tagType() {
      const map = this.typeMap || TAG_TYPE_PRESETS[this.preset] || {}
      if (map[this.value] !== undefined) {
        return map[this.value]
      }
      return 'info'
    }
  }
}
</script>
