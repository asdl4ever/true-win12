<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDesktopStore } from '../stores/desktop'

const desktop = useDesktopStore()
const { power } = storeToRefs(desktop)
</script>

<template>
  <Transition name="power" mode="out-in">
    <!-- 开机：ASDL 从地平线后面升起来 -->
    <section v-if="power === 'boot'" key="boot" class="power boot">
      <div class="boot-sun" aria-hidden="true"></div>
      <div class="boot-stage">
        <p class="boot-mark">ASDL</p>
      </div>
      <div class="boot-line" aria-hidden="true"></div>
      <p class="boot-tip">正在启动 ASDL 桌面</p>
    </section>

    <section v-else-if="power === 'shutdown'" key="shutdown" class="power bye">
      <span class="bye-spin" aria-hidden="true">
        <v-icon icon="mdi-loading" size="26" />
      </span>
      <p>正在关机</p>
    </section>

    <section v-else-if="power === 'off'" key="off" class="power off">
      <button class="off-btn" type="button" aria-label="开机" @click="desktop.powerOn()">
        <v-icon icon="mdi-power" size="26" />
      </button>
      <p class="off-tip">按下电源键开机</p>
    </section>
  </Transition>
</template>

<style scoped>
.power {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ------------------------------- 开机 ------------------------------- */

.boot {
  background: linear-gradient(180deg, #fffaea 0%, #fff1c8 42%, #f8d98c 62%, #e6b055 100%);
}

/* 地平线以上是舞台，文字从舞台下沿（也就是地平线）升出来 */
.boot-stage {
  position: absolute;
  inset: 0 0 38% 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.boot-mark {
  margin: 0 0 -0.18em;
  font-family: var(--display-font);
  font-weight: 800;
  font-size: clamp(46px, 8vw, 84px);
  letter-spacing: 0.16em;
  color: #4a3208;
  text-shadow: 0 10px 34px rgba(255, 226, 150, 0.9);
  animation: mark-rise 1.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes mark-rise {
  from {
    opacity: 0;
    transform: translateY(105%);
    filter: blur(8px);
  }
  55% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: translateY(-6%);
    filter: blur(0);
  }
}

.boot-sun {
  position: absolute;
  left: 50%;
  top: 62%;
  width: 130vw;
  height: 62vh;
  background: radial-gradient(
    50% 50% at 50% 100%,
    rgba(255, 238, 182, 0.95),
    rgba(255, 238, 182, 0) 70%
  );
  animation: sun-rise 1.8s ease both;
}

@keyframes sun-rise {
  from {
    opacity: 0;
    transform: translate(-50%, -72%) scaleY(0.6);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scaleY(1);
  }
}

.boot-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 62%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(120, 86, 24, 0.5), transparent);
  animation: line-open 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes line-open {
  from {
    transform: scaleX(0.15);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.boot-tip {
  position: absolute;
  bottom: 12%;
  margin: 0;
  font-size: 13px;
  color: rgba(74, 50, 8, 0.62);
  animation: tip-in 1s ease 1.1s both;
}

@keyframes tip-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ------------------------------- 关机 ------------------------------- */

.bye {
  gap: 14px;
  background: linear-gradient(180deg, #fff6dc 0%, #f2d59a 100%);
  color: #4a3208;
  font-size: 14px;
}

.bye p {
  margin: 0;
}

.bye-spin {
  display: grid;
  place-items: center;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ------------------------------ 已关机 ------------------------------ */

.off {
  gap: 16px;
  background: radial-gradient(62% 62% at 50% 58%, #2b1f0d 0%, #161003 100%);
}

.off-btn {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 246, 220, 0.28);
  border-radius: 50%;
  background: rgba(255, 246, 220, 0.06);
  color: #ffeec2;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.off-btn:hover {
  background: rgba(255, 246, 220, 0.14);
  box-shadow: 0 0 0 8px rgba(255, 238, 194, 0.07);
  transform: scale(1.04);
}

.off-tip {
  margin: 0;
  font-size: 12.5px;
  color: rgba(255, 238, 194, 0.62);
}

/* 整层淡入淡出 */
.power-enter-active,
.power-leave-active {
  transition: opacity 0.55s ease;
}

.power-enter-from,
.power-leave-to {
  opacity: 0;
}
</style>
