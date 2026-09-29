<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../../stores/player'

/* 伪音乐软件：正在播放 + 进度 + 歌单 */
const player = usePlayerStore()

const percent = computed({
  get: () => player.percent,
  set: (value: number) => player.seek(Number(value)),
})

function format(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="music">
    <section class="now">
      <div class="art" :class="{ spinning: player.playing }">
        <v-icon :icon="player.current.icon" size="30" />
      </div>

      <div class="meta">
        <h3 class="track">{{ player.current.title }}</h3>
        <p class="artist">{{ player.current.artist }} · {{ player.current.album }}</p>

        <p class="waves" :class="{ on: player.playing }" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </p>
      </div>
    </section>

    <v-slider
      v-model="percent"
      class="seek"
      :min="0"
      :max="100"
      :step="1"
      hide-details
      density="compact"
      color="#3d2b0e"
      track-color="rgba(61, 43, 14, 0.22)"
      track-fill-color="rgba(61, 43, 14, 0.7)"
    />

    <div class="times">
      <span>{{ format(player.progress) }}</span>
      <span>{{ format(player.current.duration) }}</span>
    </div>

    <div class="controls">
      <v-btn icon="mdi-skip-previous" variant="text" size="small" aria-label="上一首" @click="player.prev()" />
      <v-btn
        class="play"
        :icon="player.playing ? 'mdi-pause' : 'mdi-play'"
        variant="flat"
        size="large"
        :aria-label="player.playing ? '暂停' : '播放'"
        @click="player.toggle()"
      />
      <v-btn icon="mdi-skip-next" variant="text" size="small" aria-label="下一首" @click="player.next()" />
    </div>

    <ul class="playlist">
      <li v-for="(track, i) in player.tracks" :key="track.id">
        <button
          class="pl-row"
          :class="{ on: i === player.index }"
          type="button"
          @click="player.playTrack(track.id)"
        >
          <span class="pl-icon">
            <v-icon :icon="i === player.index && player.playing ? 'mdi-volume-high' : track.icon" size="16" />
          </span>
          <span class="pl-title">{{ track.title }}</span>
          <span class="pl-artist">{{ track.artist }}</span>
          <span class="pl-dur">{{ format(track.duration) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.music {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: min(430px, 54dvh);
  padding: 16px;
}

/* ------------------------------- 正在播放 ------------------------------- */

.now {
  display: flex;
  align-items: center;
  gap: 14px;
}

.art {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 68px;
  height: 68px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--accent) 22%, rgba(255, 255, 255, 0.72));
  color: var(--accent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.art.spinning {
  animation: art-pulse 3.2s ease-in-out infinite;
}

@keyframes art-pulse {
  50% {
    transform: scale(1.035);
  }
}

.meta {
  min-width: 0;
}

.track {
  margin: 0 0 2px;
  font-family: var(--display-font);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.artist {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-muted);
}

/* 播放时的小律动 */
.waves {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 14px;
  margin: 7px 0 0;
}

.waves i {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--accent);
  transform: scaleY(0.25);
  transform-origin: bottom;
  opacity: 0.45;
}

.waves.on i {
  opacity: 1;
  animation: wave 0.9s ease-in-out infinite;
}

.waves i:nth-child(2) {
  animation-delay: 0.12s;
}
.waves i:nth-child(3) {
  animation-delay: 0.24s;
}
.waves i:nth-child(4) {
  animation-delay: 0.36s;
}
.waves i:nth-child(5) {
  animation-delay: 0.48s;
}

@keyframes wave {
  0%,
  100% {
    transform: scaleY(0.25);
  }
  50% {
    transform: scaleY(1);
  }
}

.seek {
  margin: 2px 0 -6px;
}

.times {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--text-muted);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.controls .play {
  background: var(--accent);
  color: #fffdf5;
}

/* -------------------------------- 歌单 -------------------------------- */

.playlist {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: auto;
  min-height: 0;
}

.pl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: var(--text);
  font-family: var(--body-font);
  font-size: 12.5px;
  text-align: start;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;
}

.pl-row:hover {
  background: rgba(255, 255, 255, 0.62);
}

.pl-row.on {
  background: rgba(255, 255, 255, 0.78);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.pl-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.7));
  color: var(--accent);
}

.pl-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pl-artist {
  margin-inline-start: auto;
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--text-muted);
}

.pl-dur {
  flex: 0 0 auto;
  font-size: 10.5px;
  color: var(--text-muted);
}
</style>
