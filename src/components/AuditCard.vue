<template>
  <div class="audit-card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.audit-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  height: auto; /* Diperbarui agar tidak error tumpang tindih */
  display: flex;
  flex-direction: column;
}
.card-header {
  font-weight: 600;
  font-size: 1.1rem;
  color: #111827;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
}
.card-body {
  flex-grow: 1;
}
</style>