<template>
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>
</template>

<style scoped>
.skeleton-card {
  width: 100%;
  background: var(--surface);
  border-radius: 28px;
  padding: 1.25rem;
  animation: pulse 1.5s infinite;
}
.skeleton-image {
  height: 200px;
  background: var(--border);
  border-radius: 16px;
  margin-bottom: 1rem;
}
.skeleton-line {
  height: 20px;
  background: var(--border);
  border-radius: 10px;
  margin: 0.5rem 0;
}
.skeleton-line.short {
  width: 60%;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>