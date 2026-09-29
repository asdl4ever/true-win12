<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDesktopStore } from '../../stores/desktop'

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
/* 开机 / 关机 / 已关机是唯一允许"实心不透明"的场景——它盖住整个桌面，
   背后没有任何东西可透，所以不使用玻璃材质，只用奶黄令牌铺光。 */
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

/* 奶黄环境：向上渐亮的暖光，把标记托出来 */
.boot {
  background: radial-gradient(
    120% 90% at 50% 6%,
    var(--cream-000) 0%,
    var(--cream-100) 50%,
    var(--cream-200) 100%
  );
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

/* 品牌 Logotype：全大写 + 宽字距，是全站唯一允许的例外 */
.boot-mark {
  margin: 0 0 -0.18em;
  font-family: var(--display-font);
  font-weight: var(--fw-bold);
  font-size: var(--fs-hero);
  letter-spacing: 0.16em;
  color: var(--ink-900);
  text-shadow: 0 8px 34px color-mix(in srgb, var(--cream-000) 95%, transparent);
  animation: mark-rise 1.7s var(--spring-out) both;
}

/* 只碰 opacity 与 transform —— 动画 filter 会触发逐帧重绘 */
@keyframes mark-rise {
  from {
    opacity: 0;
    transform: translateY(105%) scale(0.96);
  }
  55% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: translateY(-6%) scale(1);
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
    color-mix(in srgb, var(--cream-050) 90%, transparent),
    transparent 70%
  );
  animation: sun-rise 1.8s var(--spring-out) both;
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
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ink-700) 50%, transparent),
    transparent
  );
  animation: line-open 1.4s var(--spring-settle) both;
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
  font-size: var(--fs-body);
  color: var(--ink-500);
  animation: tip-in 1s var(--spring-settle) 1.1s both;
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
  background: linear-gradient(180deg, var(--cream-050) 0%, var(--cream-200) 100%);
  color: var(--ink-900);
  font-size: var(--fs-body);
}

.bye p {
  margin: 0;
}

.bye-spin {
  display: grid;
  place-items: center;
  /* 匀速旋转是 linear 的唯一正当用法 */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ------------------------------ 已关机 ------------------------------ */

/* 全站唯一的近黑场景：关机后屏幕本就该是暗的。
   底色仍从暖棕墨色派生，不用纯黑，以免和整体暖调脱节。 */
.off {
  gap: 16px;
  background: radial-gradient(
    62% 62% at 50% 58%,
    color-mix(in srgb, var(--ink-900) 62%, #000) 0%,
    color-mix(in srgb, var(--ink-900) 26%, #000) 100%
  );
}

.off-btn {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--cream-050) 28%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--cream-050) 6%, transparent);
  color: var(--cream-100);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.off-btn:hover {
  background: color-mix(in srgb, var(--cream-050) 14%, transparent);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--cream-100) 7%, transparent);
  transform: scale(1.06);
}

.off-btn:active {
  transform: scale(0.94);
  transition-duration: var(--dur-1);
}

.off-tip {
  margin: 0;
  font-size: var(--fs-label);
  color: color-mix(in srgb, var(--cream-100) 62%, transparent);
}

/* 整层淡入淡出 */
.power-enter-active,
.power-leave-active {
  transition: opacity var(--dur-5) var(--spring-settle);
}

.power-enter-from,
.power-leave-to {
  opacity: 0;
}
</style>
