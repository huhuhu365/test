<template>
    <div v-if="activeApp === 'guide'" class="guide-shell">
        <aside class="guide-sidebar">
            <button
                type="button"
                class="brand guide-brand"
                title="testへ"
                @click="goToPath('/test')"
            >
                <div class="brand-mark">旅</div>
                <div class="brand-copy">
                    <p>近くのグルメ・遊び案内</p>
                    <span>Address Local Guide</span>
                </div>
            </button>

            <nav class="side-nav" aria-label="ローカルガイド">
                <button type="button" class="active" title="住所検索">
                    <MapPin :size="19" aria-hidden="true" />
                    <span>住所検索</span>
                </button>
                <button
                    type="button"
                    title="車両管理へ"
                    @click="goToPath('/test')"
                >
                    <Car :size="19" aria-hidden="true" />
                    <span>車両管理へ</span>
                </button>
            </nav>

            <div class="sidebar-footer">
                <p>URL</p>
                <strong>/test2</strong>
            </div>
        </aside>

        <main class="guide-workspace">
            <section class="guide-hero">
                <div>
                    <p class="eyebrow">Japan Local Finder</p>
                    <h1>
                        住所を入力すると、近くの美味しい店と遊べる場所を表示します
                    </h1>
                </div>
                <button
                    type="button"
                    class="ghost-button"
                    @click="goToPath('/test')"
                >
                    車両管理システムへ
                </button>
            </section>

            <section class="guide-search-panel">
                <label class="guide-search">
                    <MapPin :size="22" aria-hidden="true" />
                    <input
                        v-model.trim="guideAddress"
                        type="search"
                        placeholder="例：東京駅、新宿駅、豊洲駅、京都駅、大阪駅"
                        @keyup.enter="searchLocalSpots"
                    />
                </label>
                <select
                    v-model="guideCategory"
                    class="guide-filter-select"
                    aria-label="カテゴリで絞り込み"
                >
                    <option
                        v-for="option in guideCategoryOptions"
                        :key="option.value"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
                <button
                    type="button"
                    class="primary-button"
                    @click="searchLocalSpots"
                >
                    <Sparkles :size="18" aria-hidden="true" />
                    <span>おすすめを表示</span>
                </button>
                <div class="guide-chips" aria-label="よく使う駅">
                    <button
                        v-for="station in quickStationQueries"
                        :key="station"
                        type="button"
                        @click="setQuickStation(station)"
                    >
                        {{ station }}
                    </button>
                </div>
                <div
                    v-if="guideHistory.length"
                    class="guide-history"
                    aria-label="検索履歴"
                >
                    <span>最近:</span>
                    <button
                        v-for="history in guideHistory"
                        :key="history"
                        type="button"
                        @click="setQuickStation(history)"
                    >
                        {{ history }}
                    </button>
                </div>
                <p class="guide-search-note">
                    練習用のローカルデータです。駅名を優先して判定します。未登録の駅名でも「駅周辺」として表示します。
                </p>
            </section>

            <section class="guide-summary">
                <article>
                    <MapPin :size="20" aria-hidden="true" />
                    <div>
                        <span>検索エリア</span>
                        <strong>{{ selectedGuideArea.name }}</strong>
                    </div>
                </article>
                <article>
                    <Utensils :size="20" aria-hidden="true" />
                    <div>
                        <span>表示候補</span>
                        <strong v-if="isSearchingPlaces">検索中...</strong>
                        <strong v-else>{{ filteredGuideSpots.length }} 件</strong>
                    </div>
                </article>
                <article>
                    <FerrisWheel :size="20" aria-hidden="true" />
                    <div>
                        <span>最寄り候補</span>
                        <strong>{{ nearestGuideSpot?.distance || "-" }}</strong>
                    </div>
                </article>
            </section>

            <section class="guide-panel result-panel">
                <div class="panel-header">
                    <div>
                        <h2>検索結果</h2>
                        <p>
                            {{ selectedGuideArea.name }} /
                            {{ activeGuideCategoryLabel }} / 距離順
                        </p>
                    </div>
                    <strong class="guide-score"
                        >平均評価 {{ averageGuideRating }}</strong
                    >
                </div>
                <div class="result-list">
                    <article
                        v-for="spot in filteredGuideSpots"
                        :key="spot.id"
                        class="result-card"
                    >
                        <div :class="['spot-icon', spot.type]">
                            <component
                                :is="
                                    spot.type === 'food'
                                        ? Utensils
                                        : FerrisWheel
                                "
                                :size="18"
                                aria-hidden="true"
                            />
                        </div>
                        <div class="result-body">
                            <div class="result-head">
                                <div>
                                    <span>{{ spot.typeLabel }}</span>
                                    <strong>{{ spot.name }}</strong>
                                </div>
                                <button
                                    type="button"
                                    class="save-spot-button"
                                    @click="toggleFavoriteSpot(spot)"
                                >
                                    <Save :size="15" aria-hidden="true" />
                                    <span>{{
                                        isFavoriteSpot(spot)
                                            ? "保存済み"
                                            : "保存"
                                    }}</span>
                                </button>
                            </div>
                            <p>{{ spot.description }}</p>
                            <div class="spot-meta">
                                <span>徒歩 {{ spot.distance }}</span>
                                <span>評価 {{ spot.rating }}</span>
                                <span>{{ spot.openLabel }}</span>
                                <span>{{ spot.tag }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section class="guide-panel favorite-panel">
                <div class="panel-header">
                    <div>
                        <h2>保存した候補</h2>
                        <p>気になる場所を一時保存できます。</p>
                    </div>
                </div>
                <div v-if="favoriteGuideSpots.length" class="favorite-list">
                    <button
                        v-for="spot in favoriteGuideSpots"
                        :key="spot.id"
                        type="button"
                        @click="toggleFavoriteSpot(spot)"
                    >
                        {{ spot.name }}
                        <span>{{ spot.typeLabel }} / {{ spot.distance }}</span>
                    </button>
                </div>
                <p v-else class="empty-guide">
                    まだ保存した候補はありません。検索結果の「保存」を押してください。
                </p>
            </section>

            <div class="guide-grid">
                <section class="guide-panel">
                    <div class="panel-header">
                        <div>
                            <h2>美味しいもの</h2>
                            <p>
                                {{ selectedGuideArea.name }} 周辺で食べたいもの
                            </p>
                        </div>
                    </div>
                    <div class="spot-list">
                        <article
                            v-for="spot in selectedGuideArea.food"
                            :key="spot.name"
                            class="spot-card"
                        >
                            <div class="spot-icon food">
                                <Utensils :size="18" aria-hidden="true" />
                            </div>
                            <div>
                                <strong>{{ spot.name }}</strong>
                                <p>{{ spot.description }}</p>
                                <span>{{ spot.walk }} · {{ spot.budget }}</span>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="guide-panel">
                    <div class="panel-header">
                        <div>
                            <h2>遊べる場所</h2>
                            <p>観光、買い物、散歩に使えるスポット</p>
                        </div>
                    </div>
                    <div class="spot-list">
                        <article
                            v-for="spot in selectedGuideArea.fun"
                            :key="spot.name"
                            class="spot-card"
                        >
                            <div class="spot-icon fun">
                                <FerrisWheel :size="18" aria-hidden="true" />
                            </div>
                            <div>
                                <strong>{{ spot.name }}</strong>
                                <p>{{ spot.description }}</p>
                                <span
                                    >{{ spot.walk }} · {{ spot.bestTime }}</span
                                >
                            </div>
                        </article>
                    </div>
                </section>
            </div>

            <section class="guide-panel itinerary-panel">
                <div class="panel-header">
                    <div>
                        <h2>半日モデルコース</h2>
                        <p>入力したエリアに合わせた練習用の提案です。</p>
                    </div>
                </div>
                <div class="itinerary">
                    <div
                        v-for="item in selectedGuideArea.plan"
                        :key="item.time"
                    >
                        <span>{{ item.time }}</span>
                        <strong>{{ item.title }}</strong>
                        <p>{{ item.note }}</p>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <div
        v-else
        :class="['app-shell', { 'sidebar-collapsed': isSidebarCollapsed }]"
    >
        <aside class="sidebar">
            <button
                type="button"
                class="brand"
                title="ロゴ"
                @click="handleLogoClick"
            >
                <div class="brand-mark">車</div>
                <div class="brand-copy">
                    <p>中古車管理システム</p>
                    <span>Spring Boot + MyBatis</span>
                </div>
            </button>

            <button
                type="button"
                class="collapse-button"
                :title="
                    isSidebarCollapsed
                        ? 'サイドメニューを表示'
                        : 'サイドメニューを折りたたむ'
                "
                @click="toggleSidebar"
            >
                <component
                    :is="isSidebarCollapsed ? PanelRightOpen : PanelLeftClose"
                    :size="18"
                    aria-hidden="true"
                />
                <span>{{ isSidebarCollapsed ? "表示" : "非表示" }}</span>
            </button>

            <nav class="side-nav" aria-label="メインナビゲーション">
                <button
                    v-for="item in navItems"
                    :key="item.id"
                    type="button"
                    :class="{ active: currentView === item.id }"
                    @click="currentView = item.id"
                    :title="item.label"
                >
                    <component :is="item.icon" :size="19" aria-hidden="true" />
                    <span>{{ item.label }}</span>
                </button>
            </nav>

            <div class="sidebar-footer">
                <p>API</p>
                <strong>{{ apiStatusLabel }}</strong>
                <button
                    type="button"
                    class="mini-link"
                    @click="goToPath('/test2')"
                >
                    /test2へ
                </button>
            </div>
        </aside>

        <main class="workspace">
            <header class="topbar">
                <div>
                    <p class="eyebrow">Used Car Desk</p>
                    <h1>{{ pageTitle }}</h1>
                </div>
                <div class="topbar-actions">
                    <button
                        type="button"
                        class="icon-button"
                        title="再読み込み"
                        @click="loadVehicles"
                    >
                        <RefreshCw :size="19" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="icon-button"
                        title="CSVを書き出し"
                        @click="exportVehicles"
                    >
                        <Download :size="19" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="primary-button"
                        @click="openCreateModal"
                    >
                        <Plus :size="18" aria-hidden="true" />
                        <span>車両を追加</span>
                    </button>
                </div>
            </header>

            <div v-if="apiError" class="api-banner">
                {{ apiError }}
            </div>

            <section v-if="currentView === 'overview'" class="content-stack">
                <div class="stats-grid">
                    <article
                        v-for="stat in stats"
                        :key="stat.label"
                        class="stat-card"
                    >
                        <div :class="['stat-icon', stat.tone]">
                            <component
                                :is="stat.icon"
                                :size="21"
                                aria-hidden="true"
                            />
                        </div>
                        <p>{{ stat.label }}</p>
                        <strong>{{ stat.value }}</strong>
                        <span>{{ stat.note }}</span>
                    </article>
                </div>

                <section class="panel">
                    <div class="panel-header">
                        <div>
                            <h2>在庫車両一覧</h2>
                            <p>
                                {{
                                    isLoading
                                        ? "読み込み中..."
                                        : `全 ${filteredVehicles.length} 件`
                                }}
                            </p>
                        </div>
                        <div class="filters">
                            <label class="search-field">
                                <Search :size="18" aria-hidden="true" />
                                <input
                                    v-model.trim="query"
                                    type="search"
                                    placeholder="車名、管理番号、店舗で検索"
                                />
                            </label>
                            <select
                                v-model="makerFilter"
                                aria-label="メーカーで絞り込み"
                            >
                                <option value="all">すべてのメーカー</option>
                                <option
                                    v-for="maker in makers"
                                    :key="maker"
                                    :value="maker"
                                >
                                    {{ maker }}
                                </option>
                            </select>
                            <select
                                v-model="statusFilter"
                                aria-label="状態で絞り込み"
                            >
                                <option value="all">すべての状態</option>
                                <option
                                    v-for="status in statusOptions"
                                    :key="status"
                                    :value="status"
                                >
                                    {{ statusLabels[status] }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="table-wrap">
                        <table class="vehicle-table">
                            <thead>
                                <tr>
                                    <th>車両</th>
                                    <th>管理番号</th>
                                    <th>メーカー</th>
                                    <th>年式</th>
                                    <th>色</th>
                                    <th>走行距離</th>
                                    <th>価格</th>
                                    <th>状態</th>
                                    <th>店舗</th>
                                    <th class="actions-col">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="vehicle in filteredVehicles"
                                    :key="vehicle.id"
                                >
                                    <td>
                                        <div class="vehicle-cell">
                                            <div class="avatar">
                                                {{ vehicle.maker.slice(0, 1) }}
                                            </div>
                                            <div>
                                                <strong>{{
                                                    vehicle.name
                                                }}</strong>
                                                <span
                                                    >{{ vehicle.fuel }} ·
                                                    {{ vehicle.transmission }} ·
                                                    車検
                                                    {{
                                                        vehicle.inspection
                                                    }}</span
                                                >
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ vehicle.stockNo }}</td>
                                    <td>{{ vehicle.maker }}</td>
                                    <td>{{ vehicle.year }}年</td>
                                    <td>{{ vehicle.color || "未設定" }}</td>
                                    <td>
                                        {{ formatMileage(vehicle.mileage) }}
                                    </td>
                                    <td>{{ formatPrice(vehicle.price) }}</td>
                                    <td>
                                        <span
                                            :class="[
                                                'status-pill',
                                                statusTone(vehicle.status),
                                            ]"
                                            >{{
                                                statusLabels[vehicle.status]
                                            }}</span
                                        >
                                    </td>
                                    <td>{{ vehicle.store }}</td>
                                    <td>
                                        <div class="row-actions">
                                            <button
                                                type="button"
                                                title="編集"
                                                @click="openEditModal(vehicle)"
                                            >
                                                <Pencil
                                                    :size="17"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                title="削除"
                                                @click="
                                                    removeVehicle(vehicle.id)
                                                "
                                            >
                                                <Trash2
                                                    :size="17"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="filteredVehicles.length === 0">
                                    <td colspan="10" class="empty-state">
                                        条件に一致する車両が見つかりません
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>

            <section
                v-else-if="currentView === 'analytics'"
                class="content-grid"
            >
                <article class="panel chart-panel">
                    <div class="panel-header">
                        <div>
                            <h2>価格帯分析</h2>
                            <p>現在の在庫価格をもとに集計</p>
                        </div>
                    </div>
                    <div class="bars">
                        <div
                            v-for="bucket in priceBuckets"
                            :key="bucket.label"
                            class="bar-row"
                        >
                            <span>{{ bucket.label }}</span>
                            <div class="bar-track">
                                <i :style="{ width: bucket.percent + '%' }"></i>
                            </div>
                            <strong>{{ bucket.count }}</strong>
                        </div>
                    </div>
                </article>

                <article class="panel ranking-panel">
                    <div class="panel-header">
                        <div>
                            <h2>低走行おすすめ</h2>
                            <p>走行距離が短い車両を優先表示</p>
                        </div>
                    </div>
                    <div class="ranking-list">
                        <div
                            v-for="(vehicle, index) in lowMileageVehicles"
                            :key="vehicle.id"
                            class="ranking-item"
                        >
                            <span>{{ index + 1 }}</span>
                            <div>
                                <strong>{{ vehicle.name }}</strong>
                                <p>
                                    {{ vehicle.year }}年 · {{ vehicle.maker }}
                                </p>
                            </div>
                            <em>{{ formatMileage(vehicle.mileage) }}</em>
                        </div>
                    </div>
                </article>
            </section>

            <section
                v-else-if="currentView === 'calendar'"
                class="content-stack"
            >
                <section class="panel calendar-panel">
                    <div class="panel-header">
                        <div>
                            <h2>カレンダー（日程表）</h2>
                        </div>
                    </div>

                    <div
                        class="calendar-grid"
                        :style="{
                            '--calendar-columns': visibleWeekLabels.length,
                        }"
                    >
                        <div
                            v-for="day in visibleWeekLabels"
                            :key="day.key"
                            :class="['calendar-weekday', day.key]"
                        >
                            {{ day.label }}
                        </div>
                        <div
                            v-for="day in visibleCalendarDays"
                            :key="`${day.week}-${day.key}`"
                            :class="[
                                'calendar-day',
                                day.key,
                                { muted: !day.date },
                            ]"
                        >
                            <strong>{{ day.date || "" }}</strong>
                            <span>{{ day.event }}</span>
                        </div>
                    </div>
                </section>
            </section>

            <section v-else class="content-grid">
                <article class="panel">
                    <div class="panel-header">
                        <div>
                            <h2>メーカー別概覧</h2>
                            <p>在庫台数と平均価格</p>
                        </div>
                    </div>
                    <div class="class-list">
                        <div
                            v-for="item in makerSummary"
                            :key="item.maker"
                            class="class-item"
                        >
                            <div>
                                <strong>{{ item.maker }}</strong>
                                <span>{{ item.count }} 台</span>
                            </div>
                            <p>{{ formatPrice(item.averagePrice) }}</p>
                        </div>
                    </div>
                </article>

                <article class="panel notice-panel">
                    <div class="panel-header">
                        <div>
                            <h2>対応リマインド</h2>
                            <p>状態、走行距離、車検データから作成</p>
                        </div>
                    </div>
                    <div class="todo-list">
                        <div
                            v-for="todo in todos"
                            :key="todo.title"
                            class="todo-item"
                        >
                            <component
                                :is="todo.icon"
                                :size="18"
                                aria-hidden="true"
                            />
                            <div>
                                <strong>{{ todo.title }}</strong>
                                <span>{{ todo.desc }}</span>
                            </div>
                        </div>
                    </div>
                </article>
            </section>
        </main>

        <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
            <form class="vehicle-modal" @submit.prevent="saveVehicle">
                <div class="modal-header">
                    <div>
                        <p class="eyebrow">
                            {{ editingId ? "Edit Vehicle" : "New Vehicle" }}
                        </p>
                        <h2>{{ editingId ? "車両を編集" : "車両を追加" }}</h2>
                    </div>
                    <button
                        type="button"
                        class="icon-button"
                        title="閉じる"
                        @click="closeModal"
                    >
                        <X :size="19" aria-hidden="true" />
                    </button>
                </div>

                <div class="form-grid">
                    <label>
                        車名
                        <input v-model.trim="form.name" required />
                    </label>
                    <label>
                        管理番号
                        <input v-model.trim="form.stockNo" required />
                    </label>
                    <label>
                        メーカー
                        <select v-model="form.maker" required>
                            <option
                                v-for="maker in makers"
                                :key="maker"
                                :value="maker"
                            >
                                {{ maker }}
                            </option>
                        </select>
                    </label>
                    <label>
                        年式
                        <select v-model.number="form.year" required>
                            <option
                                v-for="year in yearOptions"
                                :key="year"
                                :value="year"
                            >
                                {{ year }}
                            </option>
                        </select>
                    </label>
                    <label>
                        走行距離
                        <input
                            v-model.number="form.mileage"
                            type="number"
                            min="0"
                            required
                        />
                    </label>
                    <label>
                        価格
                        <input
                            v-model.number="form.price"
                            type="number"
                            min="0"
                            step="10000"
                            required
                        />
                    </label>
                    <label>
                        燃料
                        <select v-model="form.fuel" required>
                            <option
                                v-for="fuel in fuelOptions"
                                :key="fuel"
                                :value="fuel"
                            >
                                {{ fuel }}
                            </option>
                        </select>
                    </label>
                    <label>
                        色
                        <select v-model="form.color" required>
                            <option
                                v-for="color in colorOptions"
                                :key="color"
                                :value="color"
                            >
                                {{ color }}
                            </option>
                        </select>
                    </label>
                    <label>
                        ミッション
                        <select v-model="form.transmission" required>
                            <option
                                v-for="transmission in transmissionOptions"
                                :key="transmission"
                                :value="transmission"
                            >
                                {{ transmission }}
                            </option>
                        </select>
                    </label>
                    <label>
                        車検
                        <select v-model="form.inspection" required>
                            <option
                                v-for="inspection in inspectionOptions"
                                :key="inspection"
                                :value="inspection"
                            >
                                {{ inspection }}
                            </option>
                        </select>
                    </label>
                    <label>
                        店舗
                        <select v-model="form.store" required>
                            <option
                                v-for="store in stores"
                                :key="store"
                                :value="store"
                            >
                                {{ store }}
                            </option>
                        </select>
                    </label>
                    <label class="full">
                        状態
                        <select v-model="form.status">
                            <option
                                v-for="status in statusOptions"
                                :key="status"
                                :value="status"
                            >
                                {{ statusLabels[status] }}
                            </option>
                        </select>
                    </label>
                </div>

                <div class="modal-actions">
                    <button
                        type="button"
                        class="ghost-button"
                        @click="closeModal"
                    >
                        キャンセル
                    </button>
                    <button type="submit" class="primary-button">
                        <Save :size="18" aria-hidden="true" />
                        <span>保存</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
    BarChart3,
    CalendarDays,
    CalendarClock,
    Car,
    Download,
    FerrisWheel,
    Gauge,
    LayoutDashboard,
    MapPin,
    PanelLeftClose,
    PanelRightOpen,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Search,
    Sparkles,
    Tags,
    Trash2,
    TriangleAlert,
    Utensils,
    Wrench,
    X,
} from "@lucide/vue";

const apiUrl = "/api/vehicles";
const masterDataUrl = "/api/master-data";
const placesApiUrl = "/api/places/search";
const fallbackStatusOptions = ["available", "reserved", "sold", "maintenance"];
const currentPath = ref(window.location.pathname);
const guideAddress = ref("東京都渋谷区");
const selectedGuideKey = ref("tokyo");
const guideCategory = ref("all");
const guideHistory = ref([]);
const favoriteSpotIds = ref([]);
const savedVehicleColors = ref({});
const apiGuideData = ref(null);
const isSearchingPlaces = ref(false);

const guideCategoryOptions = [
    { value: "all", label: "すべて" },
    { value: "food", label: "グルメ" },
    { value: "fun", label: "遊び" },
];

const quickStationQueries = [
    "東京駅",
    "新宿駅",
    "池袋駅",
    "上野駅",
    "秋葉原駅",
    "品川駅",
    "豊洲駅",
    "京都駅",
    "大阪駅",
];
const colorOptions = [
    "ホワイト",
    "ブラック",
    "シルバー",
    "グレー",
    "レッド",
    "ブルー",
    "グリーン",
    "ブラウン",
    "イエロー",
    "その他",
];
const fuelOptions = [
    "ガソリン",
    "ハイブリッド",
    "ディーゼル",
    "電気",
    "プラグインHV",
    "その他",
];
const transmissionOptions = ["AT", "MT", "CVT"];
const yearOptions = Array.from({ length: 16 }, (_, index) => 2030 - index);
const inspectionOptions = Array.from({ length: 48 }, (_, index) => {
    const baseDate = new Date(2026, 0, 1);
    baseDate.setMonth(baseDate.getMonth() + index);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, "0");
    return `${year}/${month}`;
});

const fallbackStatusLabels = {
    available: "販売中",
    reserved: "商談中",
    sold: "成約済み",
    maintenance: "整備中",
};

const seedVehicles = [
    {
        id: 1,
        name: "トヨタ プリウス Sツーリング",
        stockNo: "UC-2026-001",
        maker: "トヨタ",
        year: 2021,
        mileage: 24800,
        price: 2180000,
        status: "available",
        store: "東京本店",
        fuel: "ハイブリッド",
        color: "ホワイト",
        transmission: "AT",
        inspection: "2027/04",
    },
    {
        id: 2,
        name: "ホンダ フィット e:HEV",
        stockNo: "UC-2026-002",
        maker: "ホンダ",
        year: 2022,
        mileage: 18200,
        price: 1680000,
        status: "available",
        store: "横浜店",
        fuel: "ハイブリッド",
        color: "ブルー",
        transmission: "AT",
        inspection: "2027/09",
    },
    {
        id: 3,
        name: "日産 ノート X",
        stockNo: "UC-2026-003",
        maker: "日産",
        year: 2020,
        mileage: 35600,
        price: 1320000,
        status: "reserved",
        store: "千葉店",
        fuel: "ガソリン",
        color: "シルバー",
        transmission: "AT",
        inspection: "2026/11",
    },
    {
        id: 4,
        name: "マツダ CX-5 XD",
        stockNo: "UC-2026-004",
        maker: "マツダ",
        year: 2019,
        mileage: 48600,
        price: 2360000,
        status: "available",
        store: "東京本店",
        fuel: "ディーゼル",
        color: "レッド",
        transmission: "AT",
        inspection: "2026/10",
    },
    {
        id: 5,
        name: "スバル フォレスター Advance",
        stockNo: "UC-2026-005",
        maker: "スバル",
        year: 2021,
        mileage: 41200,
        price: 2740000,
        status: "maintenance",
        store: "大宮店",
        fuel: "ハイブリッド",
        color: "グレー",
        transmission: "AT",
        inspection: "2028/01",
    },
    {
        id: 6,
        name: "レクサス UX250h",
        stockNo: "UC-2026-006",
        maker: "レクサス",
        year: 2022,
        mileage: 12600,
        price: 3980000,
        status: "available",
        store: "横浜店",
        fuel: "ハイブリッド",
        color: "ブラック",
        transmission: "AT",
        inspection: "2027/12",
    },
    {
        id: 7,
        name: "スズキ ジムニー XC",
        stockNo: "UC-2026-007",
        maker: "スズキ",
        year: 2020,
        mileage: 29800,
        price: 2260000,
        status: "sold",
        store: "千葉店",
        fuel: "ガソリン",
        color: "グリーン",
        transmission: "MT",
        inspection: "2026/08",
    },
    {
        id: 8,
        name: "BMW 320i M Sport",
        stockNo: "UC-2026-008",
        maker: "BMW",
        year: 2021,
        mileage: 33500,
        price: 3480000,
        status: "available",
        store: "東京本店",
        fuel: "ガソリン",
        color: "ブラック",
        transmission: "AT",
        inspection: "2027/06",
    },
];

const defaultVehicleColors = {
    "UC-2026-001": "ホワイト",
    "UC-2026-002": "ブルー",
    "UC-2026-003": "シルバー",
    "UC-2026-004": "レッド",
    "UC-2026-005": "グレー",
    "UC-2026-006": "ブラック",
    "UC-2026-007": "グリーン",
    "UC-2026-008": "ブラック",
};

const normalizeVehicle = (vehicle) => ({
    ...vehicle,
    color:
        vehicle.color && vehicle.color !== "未設定"
            ? vehicle.color
            : savedVehicleColors.value[vehicle.stockNo] ||
              defaultVehicleColors[vehicle.stockNo] ||
              "未設定",
});

const rememberVehicleColor = (vehicle) => {
    if (!vehicle.stockNo || !vehicle.color || vehicle.color === "未設定")
        return;
    savedVehicleColors.value = {
        ...savedVehicleColors.value,
        [vehicle.stockNo]: vehicle.color,
    };
    writeStoredObject("vehicleColors", savedVehicleColors.value);
};

const vehicles = ref([]);
const currentView = ref("overview");
const isSidebarCollapsed = ref(false);
const calendarSaturdayHidden = ref(false);
const query = ref("");
const makerFilter = ref("all");
const statusFilter = ref("all");
const isModalOpen = ref(false);
const editingId = ref(null);
const isLoading = ref(false);
const apiError = ref("");
const apiConnected = ref(false);
const masterMakers = ref([]);
const masterStores = ref([]);
const masterStatuses = ref([]);

const emptyForm = () => ({
    name: "",
    stockNo: "",
    maker: "トヨタ",
    year: 2022,
    mileage: 10000,
    price: 1500000,
    status: "available",
    store: "東京本店",
    fuel: "ガソリン",
    color: "ホワイト",
    transmission: "AT",
    inspection: "2027/05",
});

const form = reactive(emptyForm());

document.documentElement.lang = "ja";
document.title = "中古車管理システム";

const stationGuide = (name, keywords, food, fun, plan) => ({
    name,
    keywords,
    food,
    fun,
    plan,
});

const normalizeGuideKeyword = (value) =>
    String(value).toLowerCase().replace(/\s+/g, "");

const extractStationName = (value) => {
    const compact = String(value).trim().replace(/\s+/g, "");
    const stationMatch = compact.match(/([^都道府県市区町村]+駅)/);
    return stationMatch?.[1] || compact || "入力した駅";
};

const parseWalkMinutes = (value) => {
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : 10;
};

const readStoredArray = (key) => {
    try {
        const stored = JSON.parse(window.localStorage.getItem(key) || "[]");
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
};

const writeStoredArray = (key, value) => {
    window.localStorage.setItem(key, JSON.stringify(value));
};

const readStoredObject = (key) => {
    try {
        const stored = JSON.parse(window.localStorage.getItem(key) || "{}");
        return stored && typeof stored === "object" && !Array.isArray(stored)
            ? stored
            : {};
    } catch {
        return {};
    }
};

const writeStoredObject = (key, value) => {
    window.localStorage.setItem(key, JSON.stringify(value));
};

const createGenericStationGuide = (stationName) => ({
    name: `${stationName} 周辺`,
    keywords: [],
    food: [
        {
            name: "駅前の人気ランチ",
            description:
                "駅の改札から近い定食、そば、ラーメンなど短時間で入りやすい店を探す想定です。",
            walk: "駅から徒歩5分圏内",
            budget: "1,000円から",
        },
        {
            name: "カフェ・ベーカリー",
            description:
                "待ち合わせや休憩に使いやすいカフェ、パン屋を候補にします。",
            walk: "駅から徒歩8分圏内",
            budget: "700円から",
        },
        {
            name: "駅近居酒屋",
            description:
                "夜なら駅周辺の居酒屋、焼き鳥、海鮮系が使いやすい候補です。",
            walk: "駅から徒歩10分圏内",
            budget: "3,000円から",
        },
        {
            name: "駅前の回転寿司",
            description: "おひとり様でも入りやすい回転寿司でサクッと食事。",
            walk: "駅から徒歩5分圏内",
            budget: "1,500円から",
        },
        {
            name: "地元の定食屋",
            description: "ボリューム満点の日替わり定食が人気の食堂。",
            walk: "駅から徒歩8分圏内",
            budget: "1,000円から",
        },
        {
            name: "ラーメン専門店",
            description: "地元で評判のスープからこだわったラーメン店。",
            walk: "駅から徒歩7分圏内",
            budget: "1,200円から",
        },
        {
            name: "惣菜・テイクアウト店",
            description: "電車の中で食べられるおにぎりやサンドイッチの店。",
            walk: "駅構内または徒歩3分",
            budget: "600円から",
        },
        {
            name: "うどん・そば処",
            description: "立ち食いから座ってゆっくりまで選べる麺類の店。",
            walk: "駅から徒歩6分圏内",
            budget: "800円から",
        },
        {
            name: "焼き鳥・串焼き店",
            description: "夕方から楽しめるリーズナブルな焼き鳥店。",
            walk: "駅から徒歩10分圏内",
            budget: "2,500円から",
        },
        {
            name: "ファストフード",
            description: "時間がない時に安心の全国チェーン店。",
            walk: "駅前すぐ",
            budget: "800円から",
        },
    ],
    fun: [
        {
            name: "駅ビル・商業施設",
            description:
                "買い物、カフェ、雨の日の時間調整に使いやすい場所です。",
            walk: "駅直結または徒歩5分",
            bestTime: "いつでも",
        },
        {
            name: "周辺の公園・散歩道",
            description: "駅から少し歩いて休憩できる場所を探す想定です。",
            walk: "徒歩15分圏内",
            bestTime: "午前から夕方",
        },
        {
            name: "観光案内所・地域スポット",
            description:
                "初めての駅なら観光案内所や地域の展示施設を確認すると動きやすいです。",
            walk: "徒歩20分圏内",
            bestTime: "昼",
        },
        {
            name: "駅前の図書館",
            description: "静かに時間を過ごしたい時におすすめの公共施設。",
            walk: "徒歩10分圏内",
            bestTime: "昼",
        },
        {
            name: "地域の歴史跡",
            description: "駅周辺の史跡や記念碑を巡るミニ散策。",
            walk: "徒歩15分圏内",
            bestTime: "午前",
        },
        {
            name: "地元の商店街",
            description: "個性豊かな店が並ぶ地域密着型の商店街。",
            walk: "徒歩8分圏内",
            bestTime: "昼から夕方",
        },
        {
            name: "サイクリング散策",
            description: "レンタル自転車で周辺を効率よく観光。",
            walk: "駅前のレンタサイクル",
            bestTime: "午前",
        },
        {
            name: "コワーキングスペース",
            description: "ちょっとした作業や休憩に使える駅近のワークスペース。",
            walk: "徒歩5分圏内",
            bestTime: "いつでも",
        },
        {
            name: "薬局・ドラッグストア",
            description: "旅行中の急な買い物にも便利な駅前の薬局。",
            walk: "徒歩3分圏内",
            bestTime: "いつでも",
        },
        {
            name: "地域の銭湯・サウナ",
            description: "旅の疲れを癒す駅近くの温浴施設。",
            walk: "徒歩15分圏内",
            bestTime: "夕方から夜",
        },
    ],
    plan: [
        {
            time: "11:30",
            title: `${stationName} でランチ`,
            note: "駅近で入りやすい店を選ぶ。",
        },
        {
            time: "13:00",
            title: "駅周辺を散歩",
            note: "商業施設や公園を回る。",
        },
        {
            time: "15:00",
            title: "カフェで休憩",
            note: "次の移動前に一息つく。",
        },
    ],
});

const guideAreas = {
    koto: {
        name: "東京・江東区",
        keywords: [
            "東京都江東区",
            "江東区",
            "豊洲",
            "門前仲町",
            "清澄白河",
            "有明",
            "お台場",
            "亀戸",
        ],
        food: [
            {
                name: "豊洲市場の寿司・海鮮丼",
                description:
                    "新鮮な魚介を楽しみたい時に使いやすい定番エリア。朝から昼の食事に向いています。",
                walk: "豊洲駅から移動しやすい",
                budget: "2,000円から",
            },
            {
                name: "門前仲町の深川めし",
                description:
                    "あさりを使った郷土料理。江東区らしい食事としておすすめです。",
                walk: "門前仲町駅周辺",
                budget: "1,500円から",
            },
            {
                name: "清澄白河カフェ",
                description:
                    "コーヒー店や落ち着いたカフェが多く、散歩の休憩に使いやすいエリア。",
                walk: "清澄白河駅周辺",
                budget: "900円から",
            },
            {
                name: "亀戸餃子専門店",
                description: "パリッと焼けた餃子が名物の大衆的な中華料理店。",
                walk: "亀戸駅から徒歩3分",
                budget: "800円から",
            },
            {
                name: "東陽町のイタリアン",
                description:
                    "ビジネス街のランチに使えるパスタ・ピッツァの店。",
                walk: "東陽町駅から徒歩5分",
                budget: "1,200円から",
            },
            {
                name: "木場の自家製麺ラーメン",
                description: "魚介系スープが自慢の地元で人気のラーメン店。",
                walk: "木場駅から徒歩7分",
                budget: "1,000円から",
            },
            {
                name: "住吉のそば処",
                description: "落ち着いた雰囲気で天ぷらそばが楽しめる老舗。",
                walk: "住吉駅から徒歩5分",
                budget: "1,200円から",
            },
            {
                name: "大島の焼肉店",
                description: "リーズナブルな価格で本格焼肉を楽しめる人気店。",
                walk: "大島駅から徒歩8分",
                budget: "3,000円から",
            },
            {
                name: "越中島の海鮮居酒屋",
                description: "新鮮な刺身と日本酒が揃う夜におすすめの居酒屋。",
                walk: "越中島駅から徒歩6分",
                budget: "3,500円から",
            },
            {
                name: "辰巳のベーカリーカフェ",
                description: "手作りパンとスイーツが楽しめるモーニングにも便利な店。",
                walk: "辰巳駅から徒歩10分",
                budget: "700円から",
            },
        ],
        fun: [
            {
                name: "チームラボプラネッツ TOKYO DMM",
                description:
                    "豊洲で人気の体験型アート施設。雨の日の遊びにも向いています。",
                walk: "新豊洲駅すぐ",
                bestTime: "午前または夕方",
            },
            {
                name: "清澄庭園",
                description:
                    "静かに散歩できる日本庭園。写真やゆっくりした時間に向いています。",
                walk: "清澄白河駅から徒歩圏",
                bestTime: "午前",
            },
            {
                name: "有明ガーデン・お台場方面",
                description:
                    "買い物、温浴、イベント、海沿い散歩まで組み合わせやすいエリア。",
                walk: "有明駅周辺",
                bestTime: "午後から夜",
            },
            {
                name: "亀戸天神社",
                description: "藤の花と梅の名所として知られる歴史ある神社。",
                walk: "亀戸駅から徒歩15分",
                bestTime: "春",
            },
            {
                name: "東京都現代美術館",
                description:
                    "現代アートの企画展を楽しめるおしゃれな美術館。",
                walk: "清澄白河駅から徒歩10分",
                bestTime: "昼",
            },
            {
                name: "木場公園",
                description:
                    "広い芝生と散策路があり、週末のピクニックに最適。",
                walk: "木場駅から徒歩12分",
                bestTime: "午前から夕方",
            },
            {
                name: "夢の島公園",
                description:
                    "バーベキュー施設や野球場などアウトドアを楽しめる公園。",
                walk: "新木場駅から徒歩15分",
                bestTime: "昼",
            },
            {
                name: "東京ビッグサイト",
                description:
                    "展示会やイベントが開催される国際展示場。",
                walk: "有明駅から徒歩5分",
                bestTime: "イベント開催時",
            },
            {
                name: "深川ギャラリー散策",
                description:
                    "門前仲町周辺の小さな美術館や工芸ギャラリーを巡るコース。",
                walk: "門前仲町駅周辺",
                bestTime: "午後",
            },
            {
                name: "潮風公園",
                description:
                    "お台場海沿いの散歩道。夜景も美しくデートにもおすすめ。",
                walk: "東京テレポート駅から徒歩8分",
                bestTime: "夕方から夜",
            },
        ],
        plan: [
            {
                time: "10:30",
                title: "清澄白河でカフェ",
                note: "コーヒーを飲んでから庭園へ。",
            },
            {
                time: "12:30",
                title: "門前仲町で深川めし",
                note: "江東区らしい昼食を楽しむ。",
            },
            {
                time: "15:00",
                title: "豊洲・有明で遊ぶ",
                note: "アート施設かショッピングへ移動。",
            },
        ],
    },
    tokyoStation: stationGuide(
        "東京駅・丸の内",
        ["東京駅", "丸の内駅", "大手町駅", "日本橋駅"],
        [
            {
                name: "東京駅ラーメンストリート",
                description:
                    "東京駅地下で複数の人気ラーメンを選べる定番エリア。",
                walk: "駅構内から徒歩すぐ",
                budget: "1,200円から",
            },
            {
                name: "丸の内ランチ",
                description:
                    "落ち着いたレストランやカフェが多く、仕事帰りにも使いやすいエリア。",
                walk: "丸の内口から徒歩5分",
                budget: "1,500円から",
            },
            {
                name: "日本橋の老舗グルメ",
                description: "和食、洋食、甘味など老舗を探しやすいエリア。",
                walk: "徒歩12分目安",
                budget: "2,000円から",
            },
            {
                name: "東京駅弁当・駅ナカグルメ",
                description:
                    "構内の駅弁販売やベーカリーで手軽に食事を調達できます。",
                walk: "駅構内",
                budget: "1,000円から",
            },
            {
                name: "八重洲地下街の定食",
                description:
                    "八重洲側の地下街にはリーズナブルな定食屋が充実。",
                walk: "八重洲口から徒歩3分",
                budget: "1,200円から",
            },
            {
                name: "丸の内のイタリアンバル",
                description:
                    "仕事帰りに立ち寄りやすい気軽なイタリアンが増えています。",
                walk: "丸の内口から徒歩6分",
                budget: "2,500円から",
            },
            {
                name: "日本橋の天ぷら専門店",
                description: "老舗の天ぷらを手頃な価格で楽しめる人気店。",
                walk: "徒歩15分目安",
                budget: "2,000円から",
            },
            {
                name: "大手町のカレー店",
                description:
                    "サラリーマンに愛されるスパイシーなカレーの名店。",
                walk: "大手町駅直結",
                budget: "1,100円から",
            },
            {
                name: "東京駅フレンチトースト",
                description:
                    "甘いものが欲しい時に駅ナカのカフェで人気のスイーツ。",
                walk: "駅構内",
                budget: "900円から",
            },
            {
                name: "有楽町の焼き鳥屋",
                description:
                    "少し歩けば有楽町のガード下で焼き鳥を楽しめます。",
                walk: "徒歩10分目安",
                budget: "2,500円から",
            },
        ],
        [
            {
                name: "KITTE丸の内",
                description:
                    "買い物、食事、屋上庭園から東京駅舎の景色を楽しめる施設。",
                walk: "徒歩3分目安",
                bestTime: "午後から夜",
            },
            {
                name: "皇居外苑",
                description: "天気の良い日に散歩しやすい広いエリア。",
                walk: "徒歩12分目安",
                bestTime: "午前",
            },
            {
                name: "東京駅赤レンガ駅舎",
                description: "写真を撮りやすい代表的なスポット。",
                walk: "丸の内口すぐ",
                bestTime: "夕方",
            },
            {
                name: "日本橋三越本店",
                description:
                    "老舗デパートで買い物や美術展を楽しめる文化的施設。",
                walk: "徒歩10分目安",
                bestTime: "昼",
            },
            {
                name: "丸の内オアゾ",
                description:
                    "オフィス・ショップ・レストランが入居する複合施設。",
                walk: "徒歩5分目安",
                bestTime: "いつでも",
            },
            {
                name: "東京国際フォーラム",
                description:
                    "ガラス張りの美しい建築とイベントスペースが見どころ。",
                walk: "徒歩7分目安",
                bestTime: "イベント時",
            },
            {
                name: "八重洲ブックセンター",
                description:
                    "大型書店で専門書から文庫まで幅広く揃う。",
                walk: "八重洲口から徒歩4分",
                bestTime: "午後",
            },
            {
                name: "日本橋の散策コース",
                description:
                    "日本橋のたもとから銀座方面への街歩きが楽しいエリア。",
                walk: "徒歩15分目安",
                bestTime: "午前",
            },
            {
                name: "丸の内仲通り",
                description:
                    "季節ごとにイルミネーションが楽しめるおしゃれな通り。",
                walk: "徒歩5分目安",
                bestTime: "夕方から夜",
            },
            {
                name: "東京駅一番街",
                description:
                    "キャラクターショップやお土産店が集まる駅ナカの人気スポット。",
                walk: "駅構内",
                bestTime: "いつでも",
            },
        ],
        [
            {
                time: "11:30",
                title: "駅地下でランチ",
                note: "ラーメンか和食を選ぶ。",
            },
            {
                time: "13:00",
                title: "丸の内を散歩",
                note: "KITTEや駅舎を見て回る。",
            },
            {
                time: "15:30",
                title: "日本橋へ移動",
                note: "老舗カフェで休憩。",
            },
        ],
    ),
    shinjukuStation: stationGuide(
        "新宿駅周辺",
        ["新宿駅", "西新宿駅", "新宿三丁目駅", "都庁前駅"],
        [
            {
                name: "新宿西口思い出横丁",
                description:
                    "焼き鳥、居酒屋、定食など新宿らしい雰囲気を楽しめます。",
                walk: "西口から徒歩5分",
                budget: "2,000円から",
            },
            {
                name: "新宿三丁目カフェ",
                description:
                    "買い物の合間に入りやすいカフェやスイーツ店が多いエリア。",
                walk: "徒歩8分目安",
                budget: "1,200円から",
            },
            {
                name: "歌舞伎町ラーメン",
                description: "遅い時間でも食事候補が多いエリア。",
                walk: "東口から徒歩8分",
                budget: "1,000円から",
            },
            {
                name: "新宿南口の壽司店",
                description:
                    "回転寿司から本格的な江戸前寿司まで選択肢が多いエリア。",
                walk: "南口から徒歩6分",
                budget: "1,500円から",
            },
            {
                name: "新宿中村屋カレー",
                description:
                    "老舗洋食店の本格カレーがリーズナブルに楽しめる。",
                walk: "東口から徒歩7分",
                budget: "1,300円から",
            },
            {
                name: "西新宿の焼肉店",
                description:
                    "高層ビル街に隠れたコスパの良い焼肉の名店。",
                walk: "西口から徒歩10分",
                budget: "3,000円から",
            },
            {
                name: "新宿二丁目の居酒屋",
                description:
                    "個性的な居酒屋が集まり、夜の食事にぴったり。",
                walk: "徒歩12分目安",
                budget: "3,000円から",
            },
            {
                name: "代々木の蕎麦店",
                description:
                    "昼時にはサラリーマンで賑わう本格手打ちそばの店。",
                walk: "徒歩15分目安",
                budget: "1,200円から",
            },
            {
                name: "新宿駅東口のお好み焼き",
                description:
                    "自分で焼くスタイルのお好み焼き・もんじゃ店。",
                walk: "東口から徒歩5分",
                budget: "1,800円から",
            },
            {
                name: "新宿パンケーキ",
                description:
                    "若者に人気のふわふわパンケーキ専門カフェ。",
                walk: "徒歩10分目安",
                budget: "1,400円から",
            },
        ],
        [
            {
                name: "東京都庁展望室",
                description: "無料で東京の景色を見られる展望スポット。",
                walk: "西口から徒歩12分",
                bestTime: "夕方",
            },
            {
                name: "新宿御苑",
                description: "自然が多く、ゆっくり散歩したい時に向いています。",
                walk: "徒歩15分目安",
                bestTime: "昼",
            },
            {
                name: "ルミネ・NEWoMan",
                description: "買い物やカフェ利用に便利な駅近施設。",
                walk: "駅直結",
                bestTime: "いつでも",
            },
            {
                name: "ゴールデン街",
                description:
                    "個性的な小さなバーが集まる夜の観光スポット。",
                walk: "徒歩12分目安",
                bestTime: "夜",
            },
            {
                name: "新宿中央公園",
                description:
                    "高層ビルに囲まれた都会のオアシス。散歩に最適。",
                walk: "西口から徒歩10分",
                bestTime: "昼",
            },
            {
                name: "思い出横丁",
                description:
                    "レトロな雰囲気の飲み屋街。写真撮影にも人気。",
                walk: "西口から徒歩5分",
                bestTime: "夕方から夜",
            },
            {
                name: "新宿マルイ・モザイク通り",
                description:
                    "買い物とカフェ巡りを楽しめる若者向けエリア。",
                walk: "東口から徒歩4分",
                bestTime: "午後",
            },
            {
                name: "花園神社",
                description:
                    "新宿のど真ん中にある由緒ある神社。憩いの場。",
                walk: "東口から徒歩8分",
                bestTime: "午前",
            },
            {
                name: "歌舞伎町シアターエリア",
                description:
                    "映画館やエンタメ施設が集まる夜のエンタメ街。",
                walk: "東口から徒歩10分",
                bestTime: "夜",
            },
            {
                name: "新宿バスターミナル周辺",
                description:
                    "新しいバスターミナル周辺の散策や写真撮影に。",
                walk: "南口から徒歩5分",
                bestTime: "昼",
            },
        ],
        [
            {
                time: "12:00",
                title: "新宿三丁目でランチ",
                note: "買い物前に食事。",
            },
            {
                time: "14:00",
                title: "新宿御苑または駅ビル",
                note: "天気に合わせて選択。",
            },
            {
                time: "17:00",
                title: "都庁展望室へ",
                note: "夕方の景色を見る。",
            },
        ],
    ),
    ikebukuroStation: stationGuide(
        "池袋駅周辺",
        ["池袋駅", "東池袋駅", "目白駅"],
        [
            {
                name: "池袋ラーメン店巡り",
                description:
                    "ラーメン、つけ麺の候補が多く、昼夜どちらも使いやすいです。",
                walk: "駅から徒歩8分圏内",
                budget: "1,000円から",
            },
            {
                name: "サンシャイン通りの食事処",
                description:
                    "定食、カフェ、ファストフードまで選択肢が多い通り。",
                walk: "東口から徒歩7分",
                budget: "1,200円から",
            },
            {
                name: "デパ地下スイーツ",
                description:
                    "西武・東武の地下で手土産や休憩用の甘いものを探せます。",
                walk: "駅直結",
                budget: "800円から",
            },
            {
                name: "池袋餃子スタジアム",
                description:
                    "全国の餃子を食べ比べできるフードコート。",
                walk: "東口から徒歩8分",
                budget: "1,000円から",
            },
            {
                name: "目白の和食処",
                description:
                    "落ち着いた雰囲気の老舗和食店でランチに最適。",
                walk: "目白駅から徒歩5分",
                budget: "2,000円から",
            },
            {
                name: "池袋西口の中華料理",
                description:
                    "本場の中華料理をリーズナブルに楽しめる大衆店。",
                walk: "西口から徒歩6分",
                budget: "1,200円から",
            },
            {
                name: "東池袋のカツカレー",
                description:
                    "ボリューム満点のカツカレーが人気の洋食店。",
                walk: "東池袋駅から徒歩4分",
                budget: "1,400円から",
            },
            {
                name: "池袋のハンバーグ専門店",
                description:
                    "ジューシーなハンバーグが楽しめるファミリー向け店。",
                walk: "東口から徒歩10分",
                budget: "1,600円から",
            },
            {
                name: "エチカ池袋の立ち食いそば",
                description:
                    "駅構内の立ち食いそばで素早く食事を済ませたい時に。",
                walk: "駅構内",
                budget: "500円から",
            },
            {
                name: "池袋のアジアンカフェ",
                description:
                    "エスニック料理とおしゃれな雰囲気が楽しめるカフェ。",
                walk: "東口から徒歩8分",
                budget: "1,500円から",
            },
        ],
        [
            {
                name: "サンシャインシティ",
                description:
                    "水族館、展望台、買い物をまとめて楽しめる大型施設。",
                walk: "東口から徒歩10分",
                bestTime: "午後",
            },
            {
                name: "南池袋公園",
                description: "芝生とカフェがあり、短い休憩に向いています。",
                walk: "東口から徒歩6分",
                bestTime: "昼",
            },
            {
                name: "アニメ・書店エリア",
                description: "アニメショップや大型書店を回りやすいエリア。",
                walk: "徒歩8分圏内",
                bestTime: "午後",
            },
            {
                name: "池袋西口公園",
                description:
                    "演劇やイベントが開催される文化の発信地。",
                walk: "西口から徒歩3分",
                bestTime: "イベント時",
            },
            {
                name: "鬼子母神",
                description:
                    "都心とは思えない静かな境内で心を落ち着かせる場所。",
                walk: "徒歩20分目安",
                bestTime: "午前",
            },
            {
                name: "池袋サンシャイン水族館",
                description:
                    "都市型水族館でクラゲやペンギンが人気。",
                walk: "東口から徒歩10分",
                bestTime: "昼",
            },
            {
                name: "池袋演芸場",
                description:
                    "落語や漫才など寄席を楽しめる伝統的な施設。",
                walk: "西口から徒歩7分",
                bestTime: "昼から夜",
            },
            {
                name: "目白庭園",
                description:
                    "日本庭園を散策できる静かな癒やしスポット。",
                walk: "目白駅から徒歩8分",
                bestTime: "午前",
            },
            {
                name: "池袋パルコ",
                description:
                    "ファッションや雑貨が揃う若者向け商業施設。",
                walk: "東口から徒歩5分",
                bestTime: "午後",
            },
            {
                name: "大塚駅周辺散歩",
                description:
                    "少し歩けば昔ながらの街並みを楽しめるエリア。",
                walk: "徒歩15分目安",
                bestTime: "夕方",
            },
        ],
        [
            {
                time: "11:30",
                title: "東口でランチ",
                note: "ラーメンか定食を選ぶ。",
            },
            {
                time: "13:00",
                title: "サンシャインシティへ",
                note: "水族館や買い物を楽しむ。",
            },
            {
                time: "16:00",
                title: "南池袋公園で休憩",
                note: "カフェで一息。",
            },
        ],
    ),
    uenoStation: stationGuide(
        "上野駅周辺",
        ["上野駅", "御徒町駅", "上野御徒町駅", "京成上野駅"],
        [
            {
                name: "アメ横食べ歩き",
                description:
                    "海鮮丼、串焼き、軽食などを少しずつ楽しめる商店街。",
                walk: "徒歩5分目安",
                budget: "1,000円から",
            },
            {
                name: "上野の洋食店",
                description: "昔ながらの洋食や喫茶店を探しやすいエリア。",
                walk: "徒歩8分目安",
                budget: "1,500円から",
            },
            {
                name: "御徒町ラーメン",
                description: "気軽に食べられるラーメンや中華の候補が多い場所。",
                walk: "徒歩10分目安",
                budget: "1,000円から",
            },
            {
                name: "上野の海鮮丼専門店",
                description:
                    "アメ横で人気の海鮮丼をリーズナブルに楽しめる店。",
                walk: "徒歩6分目安",
                budget: "1,800円から",
            },
            {
                name: "上野の焼き鳥店",
                description:
                    "夕方から営業する地元で人気の焼き鳥屋さん。",
                walk: "徒歩7分目安",
                budget: "2,500円から",
            },
            {
                name: "御徒町のカレーうどん",
                description:
                    "和風だしの効いたカレーうどんが名物の隠れた名店。",
                walk: "徒歩12分目安",
                budget: "1,200円から",
            },
            {
                name: "上野の抹茶スイーツ",
                description:
                    "公園散策の後に立ち寄りたい抹茶パフェの人気店。",
                walk: "徒歩10分目安",
                budget: "1,200円から",
            },
            {
                name: "鶯谷の串カツ居酒屋",
                description:
                    "リーズナブルな串カツが楽しめる大衆酒場。",
                walk: "徒歩15分目安",
                budget: "2,000円から",
            },
            {
                name: "上野の中華料理店",
                description:
                    "本格的な中華料理をランチセットで楽しめる。",
                walk: "徒歩5分目安",
                budget: "1,200円から",
            },
            {
                name: "入谷のとんかつ店",
                description:
                    "サクサクの衣が自慢の老舗とんかつ店。",
                walk: "徒歩18分目安",
                budget: "1,600円から",
            },
        ],
        [
            {
                name: "上野恩賜公園",
                description: "博物館、美術館、散歩をまとめて楽しめる広い公園。",
                walk: "公園口すぐ",
                bestTime: "午前から午後",
            },
            {
                name: "国立科学博物館",
                description: "雨の日でも楽しめる展示施設。",
                walk: "徒歩7分目安",
                bestTime: "昼",
            },
            {
                name: "不忍池",
                description: "散歩や写真に向いた池周辺のスポット。",
                walk: "徒歩10分目安",
                bestTime: "夕方",
            },
            {
                name: "東京国立博物館",
                description:
                    "日本と東洋の美術・歴史を展示する国内最大級の博物館。",
                walk: "徒歩10分目安",
                bestTime: "午前",
            },
            {
                name: "上野動物園",
                description:
                    "パンダや多くの動物がいる日本最古の動物園。",
                walk: "徒歩8分目安",
                bestTime: "午前",
            },
            {
                name: "旧岩崎邸庭園",
                description:
                    "洋館と和館が融合した美しい庭園と建築。",
                walk: "徒歩18分目安",
                bestTime: "昼",
            },
            {
                name: "アメ横商店街",
                description:
                    "多彩な店が並ぶ活気あふれる商店街。食べ歩きもおすすめ。",
                walk: "徒歩5分目安",
                bestTime: "昼から夕方",
            },
            {
                name: "上野の森美術館",
                description:
                    "現代美術から伝統美術まで幅広い企画展を開催。",
                walk: "徒歩7分目安",
                bestTime: "昼",
            },
            {
                name: "寛永寺",
                description:
                    "歴史ある寺院で静かな時間を過ごせる隠れスポット。",
                walk: "徒歩15分目安",
                bestTime: "午前",
            },
            {
                name: "谷中銀座商店街",
                description:
                    "レトロな商店街で買い物や猫スポットとしても人気。",
                walk: "徒歩20分目安",
                bestTime: "午後",
            },
        ],
        [
            {
                time: "10:30",
                title: "上野公園を散歩",
                note: "博物館か公園を選ぶ。",
            },
            { time: "13:00", title: "アメ横で昼食", note: "食べ歩きも可能。" },
            { time: "15:00", title: "御徒町方面へ", note: "買い物とカフェ。" },
        ],
    ),
    akihabaraStation: stationGuide(
        "秋葉原駅周辺",
        ["秋葉原駅", "秋葉原", "末広町駅", "岩本町駅"],
        [
            {
                name: "秋葉原カレー",
                description:
                    "カレー、ラーメン、肉料理など短時間で食べやすい店が多いです。",
                walk: "徒歩6分圏内",
                budget: "1,000円から",
            },
            {
                name: "電気街カフェ",
                description: "買い物の途中で休憩しやすいカフェ候補。",
                walk: "徒歩5分目安",
                budget: "800円から",
            },
            {
                name: "神田方面の居酒屋",
                description: "夜なら神田方面まで歩くと居酒屋候補が増えます。",
                walk: "徒歩12分目安",
                budget: "3,000円から",
            },
            {
                name: "秋葉原のメイドカフェ",
                description:
                    "秋葉原ならではのユニークなコンセプトカフェ体験。",
                walk: "徒歩4分目安",
                budget: "1,500円から",
            },
            {
                name: "岩本町の定食屋",
                description:
                    "昔ながらの定食屋でボリューム満点のランチ。",
                walk: "徒歩8分目安",
                budget: "900円から",
            },
            {
                name: "秋葉原のラーメン激戦区",
                description:
                    "家系・中華そば・つけ麺など様々なジャンルが集結。",
                walk: "徒歩5分目安",
                budget: "1,100円から",
            },
            {
                name: "末広町のインドカレー",
                description:
                    "本格的なインド・ネパール料理が楽しめるカレー店。",
                walk: "徒歩7分目安",
                budget: "1,300円から",
            },
            {
                name: "秋葉原のハンバーガー",
                description:
                    "アメリカンスタイルのボリューミーなハンバーガー店。",
                walk: "徒歩6分目安",
                budget: "1,500円から",
            },
            {
                name: "湯島の老舗甘味処",
                description:
                    "散歩中に立ち寄りたい落ち着いた甘味の名店。",
                walk: "徒歩12分目安",
                budget: "1,000円から",
            },
            {
                name: "秋葉原の台湾カフェ",
                description:
                    "タピオカドリンクや台湾スイーツが楽しめるカフェ。",
                walk: "徒歩3分目安",
                budget: "700円から",
            },
        ],
        [
            {
                name: "電気街",
                description: "電子部品、PC、ゲーム関連ショップを回れるエリア。",
                walk: "徒歩すぐ",
                bestTime: "午後",
            },
            {
                name: "アニメショップ巡り",
                description: "キャラクターグッズや書籍を探しやすい場所。",
                walk: "徒歩8分圏内",
                bestTime: "午後",
            },
            {
                name: "神田明神",
                description: "少し歩いて参拝や写真を楽しめるスポット。",
                walk: "徒歩12分目安",
                bestTime: "午前",
            },
            {
                name: "秋葉原ラジオ会館",
                description:
                    "フィギュアやホビー用品が揃うアキバのランドマーク。",
                walk: "徒歩3分目安",
                bestTime: "午後",
            },
            {
                name: "2k540 AKI-OKA ARTISAN",
                description:
                    "高架下のクラフト工芸品マーケット。お土産探しにも。",
                walk: "徒歩8分目安",
                bestTime: "昼",
            },
            {
                name: "湯島天満宮",
                description:
                    "学問の神様を祀る神社。梅の名所としても有名。",
                walk: "徒歩15分目安",
                bestTime: "午前",
            },
            {
                name: "秋葉原UDX",
                description:
                    "イベントスペースやショップが入居する複合施設。",
                walk: "徒歩5分目安",
                bestTime: "いつでも",
            },
            {
                name: "万世橋",
                description:
                    "レトロな煉瓦造りの橋と周辺のカフェがおしゃれ。",
                walk: "徒歩10分目安",
                bestTime: "夕方",
            },
            {
                name: "神田古書店街",
                description:
                    "古書やアートブックを探すなら神田の古書店エリアへ。",
                walk: "徒歩15分目安",
                bestTime: "昼",
            },
            {
                name: "秋葉原のゲームセンター",
                description:
                    "クレーンゲームやリズムゲームなど最新のゲームを体験。",
                walk: "徒歩すぐ",
                bestTime: "いつでも",
            },
        ],
        [
            { time: "12:00", title: "駅前でカレー", note: "短時間ランチ。" },
            { time: "13:30", title: "電気街を散策", note: "ショップを回る。" },
            { time: "16:00", title: "神田明神へ", note: "静かな場所で休憩。" },
        ],
    ),
    shinagawaStation: stationGuide(
        "品川駅周辺",
        ["品川駅", "高輪ゲートウェイ駅", "北品川駅"],
        [
            {
                name: "品川駅港南口ランチ",
                description:
                    "オフィス街の定食、カフェ、肉料理などが使いやすいエリア。",
                walk: "徒歩5分目安",
                budget: "1,200円から",
            },
            {
                name: "駅ナカ弁当・惣菜",
                description: "移動前後に買いやすい弁当やスイーツが豊富です。",
                walk: "駅構内",
                budget: "800円から",
            },
            {
                name: "高輪ホテルラウンジ",
                description: "落ち着いて休憩したい時に使いやすい候補。",
                walk: "徒歩8分目安",
                budget: "1,500円から",
            },
            {
                name: "品川の回転寿司",
                description:
                    "新鮮なネタがリーズナブルに楽しめる人気の回転寿司。",
                walk: "徒歩7分目安",
                budget: "2,000円から",
            },
            {
                name: "高輪の焼鳥店",
                description:
                    "落ち着いた雰囲気の高級焼鳥店で特別な夜に。",
                walk: "徒歩10分目安",
                budget: "4,000円から",
            },
            {
                name: "品川の天ぷら定食",
                description:
                    "サクサクの天ぷらをランチで気軽に楽しめる和食店。",
                walk: "徒歩6分目安",
                budget: "1,500円から",
            },
            {
                name: "五反田の中華料理",
                description:
                    "少し歩けば五反田の中華街で本格中華を楽しめる。",
                walk: "徒歩15分目安",
                budget: "1,200円から",
            },
            {
                name: "品川のパン屋さん",
                description:
                    "駅近のベーカリーで焼きたてパンとコーヒーの朝ごはん。",
                walk: "徒歩3分目安",
                budget: "600円から",
            },
            {
                name: "大崎のクラフトビール",
                description:
                    "クラフトビールとおつまみが楽しめるおしゃれな醸造所。",
                walk: "徒歩12分目安",
                budget: "2,500円から",
            },
            {
                name: "品川のしゃぶしゃぶ",
                description:
                    "上質な肉を楽しめるしゃぶしゃぶの名店。",
                walk: "徒歩8分目安",
                budget: "3,500円から",
            },
        ],
        [
            {
                name: "マクセル アクアパーク品川",
                description:
                    "駅近で楽しめる水族館。夜の予定にも組み込みやすいです。",
                walk: "高輪口から徒歩5分",
                bestTime: "午後から夜",
            },
            {
                name: "旧東海道・北品川散歩",
                description: "少し歩くと落ち着いた街並みを楽しめます。",
                walk: "徒歩15分目安",
                bestTime: "午前",
            },
            {
                name: "高輪ゲートウェイ周辺",
                description: "新しい街並みや駅周辺の散歩に向いています。",
                walk: "徒歩12分目安",
                bestTime: "午後",
            },
            {
                name: "品川シーサイド",
                description:
                    "海沿いの公園や散歩道を楽しめるエリア。",
                walk: "徒歩15分目安",
                bestTime: "午後",
            },
            {
                name: "史跡 品川宿",
                description:
                    "旧東海道の宿場町の面影を残す歴史スポット。",
                walk: "徒歩18分目安",
                bestTime: "午前",
            },
            {
                name: "品川プリンスホテル",
                description:
                    "ボウリングや映画館など館内で一日遊べる施設。",
                walk: "高輪口から徒歩3分",
                bestTime: "いつでも",
            },
            {
                name: "大崎ニューシティ",
                description:
                    "ビル群の間にある緑豊かな散策路とカフェ。",
                walk: "徒歩12分目安",
                bestTime: "昼",
            },
            {
                name: "池田山公園",
                description:
                    "都会の高台にある静かな庭園と湧水の池。",
                walk: "徒歩20分目安",
                bestTime: "午前",
            },
            {
                name: "品川駅港南口の夜景",
                description:
                    "高層ビル群の夜景が美しい写真スポット。",
                walk: "徒歩5分目安",
                bestTime: "夜",
            },
            {
                name: "エプソン品川アクアスタジアム",
                description:
                    "イルカショーやアトラクションが充実の水族館。",
                walk: "徒歩5分目安",
                bestTime: "昼から夜",
            },
        ],
        [
            { time: "11:30", title: "港南口でランチ", note: "駅近で食事。" },
            { time: "13:00", title: "水族館へ", note: "短時間でも楽しめる。" },
            {
                time: "15:30",
                title: "北品川散歩",
                note: "旧東海道方面へ歩く。",
            },
        ],
    ),
    tokyo: {
        name: "東京・渋谷",
        keywords: ["東京", "渋谷", "新宿", "原宿", "表参道"],
        food: [
            {
                name: "渋谷横丁",
                description:
                    "居酒屋、肉料理、海鮮などをまとめて楽しめるにぎやかなエリア。",
                walk: "徒歩8分目安",
                budget: "夜 3,000円から",
            },
            {
                name: "表参道カフェ",
                description:
                    "散歩の途中で入りやすい、デザートとコーヒーの店が多い通り。",
                walk: "徒歩12分目安",
                budget: "昼 1,500円から",
            },
            {
                name: "道玄坂ラーメン",
                description:
                    "遅い時間でも使いやすいラーメン、つけ麺の候補が多い場所。",
                walk: "徒歩7分目安",
                budget: "1,000円から",
            },
            {
                name: "原宿のクレープ店",
                description: "竹下通りで人気のクレープをテイクアウト。",
                walk: "徒歩15分目安",
                budget: "600円から",
            },
            {
                name: "渋谷の焼肉店",
                description: "厳選和牛をリーズナブルに楽しめる人気焼肉店。",
                walk: "徒歩10分目安",
                budget: "4,000円から",
            },
            {
                name: "表参道のベーカリー",
                description: "香り高いパンとコーヒーのモーニングにおすすめ。",
                walk: "徒歩14分目安",
                budget: "1,000円から",
            },
            {
                name: "渋谷の韓国料理",
                description: "若者に人気の本格韓国料理とチーズタッカルビ。",
                walk: "徒歩8分目安",
                budget: "2,500円から",
            },
            {
                name: "原宿のヴィーガンカフェ",
                description: "ヘルシーなヴィーガン料理とスムージーの店。",
                walk: "徒歩15分目安",
                budget: "1,800円から",
            },
            {
                name: "渋谷の立ち食い寿司",
                description: "新鮮なネタがリーズナブルな立ち食い寿司の人気店。",
                walk: "徒歩5分目安",
                budget: "2,000円から",
            },
            {
                name: "神宮前のパスタ専門店",
                description: "おしゃれな雰囲気で本格パスタをランチに。",
                walk: "徒歩12分目安",
                budget: "1,600円から",
            },
        ],
        fun: [
            {
                name: "MIYASHITA PARK",
                description:
                    "買い物、食事、屋上散歩をまとめて楽しめる複合施設。",
                walk: "徒歩6分目安",
                bestTime: "午後から夜",
            },
            {
                name: "代々木公園",
                description: "天気が良い日に散歩や休憩がしやすい広い公園。",
                walk: "徒歩18分目安",
                bestTime: "午前から夕方",
            },
            {
                name: "渋谷スカイ",
                description: "東京の街並みを上から見られる展望スポット。",
                walk: "徒歩5分目安",
                bestTime: "夕方",
            },
            {
                name: "明治神宮",
                description: "都心のオアシス。広大な森に囲まれた神社。",
                walk: "徒歩12分目安",
                bestTime: "午前",
            },
            {
                name: "原宿・竹下通り",
                description: "若者でにぎわう個性的なファッションとスイーツの街。",
                walk: "徒歩15分目安",
                bestTime: "午後",
            },
            {
                name: "表参道ヒルズ",
                description: "螺旋状の回廊が特徴的なおしゃれな商業施設。",
                walk: "徒歩12分目安",
                bestTime: "午後",
            },
            {
                name: "国立新美術館",
                description: "ガラス張りの美しい建築で企画展を楽しめる。",
                walk: "徒歩20分目安",
                bestTime: "昼",
            },
            {
                name: "渋谷センター街",
                description: "ネオンと看板がにぎやかな渋谷のシンボル通り。",
                walk: "徒歩5分目安",
                bestTime: "夜",
            },
            {
                name: "奥渋谷エリア",
                description: "おしゃれなカフェとセレクトショップが点在する大人の街。",
                walk: "徒歩15分目安",
                bestTime: "昼",
            },
            {
                name: "NHK放送博物館",
                description: "放送の歴史を学べるユニークな博物館。",
                walk: "徒歩10分目安",
                bestTime: "昼",
            },
        ],
        plan: [
            {
                time: "11:30",
                title: "表参道でランチ",
                note: "カフェか軽めの和食でスタート。",
            },
            {
                time: "13:00",
                title: "渋谷周辺を散策",
                note: "買い物と写真スポットを回る。",
            },
            {
                time: "16:30",
                title: "展望スポットへ",
                note: "夕方の景色を見てから夕食へ。",
            },
        ],
    },
    kyoto: {
        name: "京都駅・河原町",
        keywords: [
            "京都駅",
            "京都",
            "河原町駅",
            "河原町",
            "祇園四条駅",
            "祇園",
            "烏丸駅",
            "烏丸",
        ],
        food: [
            {
                name: "京町家ごはん",
                description:
                    "湯葉、豆腐、季節の小鉢など京都らしい食事がしやすい店。",
                walk: "徒歩10分目安",
                budget: "昼 2,000円から",
            },
            {
                name: "抹茶スイーツ店",
                description: "抹茶パフェやわらび餅など、休憩に向いた甘味処。",
                walk: "徒歩8分目安",
                budget: "1,200円から",
            },
            {
                name: "錦市場食べ歩き",
                description: "軽食を少しずつ試したい時に使いやすい商店街。",
                walk: "徒歩15分目安",
                budget: "1,000円から",
            },
            {
                name: "祇園の湯葉料理",
                description: "京都らしい湯葉と豆腐の懐石風ランチが楽しめる。",
                walk: "徒歩12分目安",
                budget: "3,000円から",
            },
            {
                name: "先斗町の串揚げ",
                description: "細い路地に隠れた串揚げの名店で夜の食事に。",
                walk: "徒歩15分目安",
                budget: "3,500円から",
            },
            {
                name: "京都駅のラーメン小路",
                description: "京都駅ビル内で全国のラーメンを楽しめる。",
                walk: "駅直結",
                budget: "1,200円から",
            },
            {
                name: "嵐山の豆腐料理",
                description: "嵯峨野の風情を感じながら湯豆腐を味わう。",
                walk: "電車で20分",
                budget: "2,500円から",
            },
            {
                name: "寺町通りのカフェ",
                description: "静かな寺町通りで古民家カフェを巡る。",
                walk: "徒歩12分目安",
                budget: "1,200円から",
            },
            {
                name: "伏見稲荷のうどん店",
                description: "参道にあるきつねうどんのおいしいお店。",
                walk: "電車で10分",
                budget: "1,000円から",
            },
            {
                name: "四条河原町の寿司店",
                description: "繁華街で新鮮なにぎり寿司が楽しめる人気店。",
                walk: "徒歩10分目安",
                budget: "2,500円から",
            },
        ],
        fun: [
            {
                name: "鴨川散歩",
                description:
                    "川沿いを歩いて京都らしい景色を楽しめる定番コース。",
                walk: "徒歩12分目安",
                bestTime: "夕方",
            },
            {
                name: "祇園エリア",
                description: "町並み、写真、カフェ巡りに向いた観光エリア。",
                walk: "徒歩18分目安",
                bestTime: "午後",
            },
            {
                name: "京都駅ビル",
                description: "雨の日でも買い物、展望、食事をまとめて楽しめる。",
                walk: "徒歩すぐ",
                bestTime: "いつでも",
            },
            {
                name: "二条城",
                description: "徳川家康の京都の拠点。世界遺産の壮大なお城。",
                walk: "徒歩25分目安",
                bestTime: "午前",
            },
            {
                name: "清水寺",
                description: "京都を代表する世界遺産の寺院。絶景の舞台。",
                walk: "バスで15分",
                bestTime: "午前から夕方",
            },
            {
                name: "嵐山・渡月橋",
                description: "風情ある橋と竹林の散策が楽しめる人気エリア。",
                walk: "電車で20分",
                bestTime: "午前",
            },
            {
                name: "金閣寺",
                description: "金色に輝く舎利殿が美しい世界遺産。",
                walk: "バスで20分",
                bestTime: "午前",
            },
            {
                name: "伏見稲荷大社",
                description: "千本鳥居が有名なパワースポット。",
                walk: "電車で10分",
                bestTime: "午前から夕方",
            },
            {
                name: "錦市場",
                description: "「京都の台所」と呼ばれる活気ある商店街。",
                walk: "徒歩10分目安",
                bestTime: "昼",
            },
            {
                name: "三十三間堂",
                description: "1001体の観音像が並ぶ圧巻の仏堂。",
                walk: "バスで10分",
                bestTime: "午前",
            },
        ],
        plan: [
            {
                time: "10:30",
                title: "錦市場を散歩",
                note: "混む前に食べ歩き。",
            },
            {
                time: "13:00",
                title: "祇園で町歩き",
                note: "写真を撮りながらカフェへ。",
            },
            {
                time: "16:00",
                title: "鴨川で休憩",
                note: "夕方の景色を見て終了。",
            },
        ],
    },
    osaka: {
        name: "大阪・梅田",
        keywords: [
            "大阪駅",
            "大阪",
            "梅田駅",
            "梅田",
            "なんば駅",
            "なんば",
            "心斎橋駅",
            "心斎橋",
        ],
        food: [
            {
                name: "お好み焼き店",
                description: "大阪らしい粉ものを楽しめる定番の候補。",
                walk: "徒歩9分目安",
                budget: "1,500円から",
            },
            {
                name: "たこ焼きスタンド",
                description:
                    "移動中に食べやすい軽食。食べ比べにも向いています。",
                walk: "徒歩5分目安",
                budget: "600円から",
            },
            {
                name: "地下街グルメ",
                description:
                    "雨の日でも行きやすい、定食やカフェが集まるエリア。",
                walk: "徒歩3分目安",
                budget: "1,200円から",
            },
            {
                name: "串カツ専門店",
                description: "新世界を代表する串カツを気軽に楽しめる。",
                walk: "電車で10分",
                budget: "2,000円から",
            },
            {
                name: "大阪駅の回転寿司",
                description: "駅ビル内で新鮮な寿司をリーズナブルに。",
                walk: "駅直結",
                budget: "1,800円から",
            },
            {
                name: "心斎橋のイタリアン",
                description: "おしゃれなイタリアンで夜のデートに最適。",
                walk: "徒歩15分目安",
                budget: "3,500円から",
            },
            {
                name: "なんばのラーメン店",
                description: "こってり系からあっさり系まで選べるラーメン激戦区。",
                walk: "徒歩10分目安",
                budget: "1,200円から",
            },
            {
                name: "天神橋筋の寿司居酒屋",
                description: "地元に愛される大衆寿司居酒屋で一杯。",
                walk: "電車で8分",
                budget: "2,500円から",
            },
            {
                name: "梅田のスイーツビュッフェ",
                description: "ホテルで楽しむアフタヌーンティー風ビュッフェ。",
                walk: "徒歩8分目安",
                budget: "3,000円から",
            },
            {
                name: "法善寺横丁の和食",
                description: "石畳の路地に佇む隠れ家的な和食の名店。",
                walk: "徒歩15分目安",
                budget: "4,000円から",
            },
        ],
        fun: [
            {
                name: "梅田スカイビル",
                description: "展望台と写真スポットとして使いやすい場所。",
                walk: "徒歩12分目安",
                bestTime: "夕方から夜",
            },
            {
                name: "グランフロント大阪",
                description: "買い物、カフェ、展示をまとめて楽しめる複合施設。",
                walk: "徒歩6分目安",
                bestTime: "午後",
            },
            {
                name: "道頓堀",
                description: "大阪らしい看板、食べ歩き、夜景を楽しめるエリア。",
                walk: "電車で15分目安",
                bestTime: "夜",
            },
            {
                name: "通天閣・新世界",
                description: "大阪のシンボル。周辺の商店街も楽しい。",
                walk: "電車で12分",
                bestTime: "昼から夜",
            },
            {
                name: "大阪城",
                description: "歴史的な大阪城と広大な公園を散策。",
                walk: "電車で10分",
                bestTime: "午前",
            },
            {
                name: "なんばグランド花月",
                description: "吉本新喜劇や漫才を楽しめるお笑いの聖地。",
                walk: "徒歩12分目安",
                bestTime: "昼から夜",
            },
            {
                name: "アメリカ村",
                description: "若者文化の発信地。個性的なショップが並ぶ。",
                walk: "徒歩15分目安",
                bestTime: "午後",
            },
            {
                name: "天保山マーケットプレース",
                description: "観覧車や水族館があるベイエリアの複合施設。",
                walk: "電車で15分",
                bestTime: "昼",
            },
            {
                name: "中之島エリア",
                description: "川沿いの散歩と美術館巡りが楽しめる文化的エリア。",
                walk: "徒歩10分目安",
                bestTime: "午後",
            },
            {
                name: "心斎橋筋商店街",
                description: "アーケード街でショッピングと食べ歩きを満喫。",
                walk: "徒歩10分目安",
                bestTime: "昼から夜",
            },
        ],
        plan: [
            {
                time: "12:00",
                title: "粉ものランチ",
                note: "お好み焼きかたこ焼きで大阪気分。",
            },
            {
                time: "14:00",
                title: "梅田で買い物",
                note: "駅周辺の大型施設を回る。",
            },
            {
                time: "18:00",
                title: "道頓堀へ移動",
                note: "夜の看板と食べ歩きを楽しむ。",
            },
        ],
    },
    default: {
        name: "入力住所の周辺",
        keywords: [],
        food: [
            {
                name: "地元の定食屋",
                description:
                    "駅前や商店街にある、昼食に使いやすい食堂を探すのがおすすめ。",
                walk: "徒歩10分圏内",
                budget: "1,000円から",
            },
            {
                name: "人気カフェ",
                description:
                    "口コミ評価が高いカフェは、休憩や待ち合わせに使いやすい候補です。",
                walk: "徒歩15分圏内",
                budget: "800円から",
            },
            {
                name: "ご当地ラーメン",
                description:
                    "地域ごとに味が違うので、短時間の食事にも向いています。",
                walk: "徒歩12分圏内",
                budget: "1,000円から",
            },
            {
                name: "地元の回転寿司",
                description: "新鮮な地元の魚を使ったリーズナブルな寿司店。",
                walk: "徒歩8分圏内",
                budget: "1,500円から",
            },
            {
                name: "商店街の焼き鳥屋",
                description: "夕方から営業する地元で愛される焼き鳥店。",
                walk: "徒歩10分圏内",
                budget: "2,000円から",
            },
            {
                name: "ファミリーレストラン",
                description: "子ども連れでも使いやすいチェーン店の定番。",
                walk: "徒歩15分圏内",
                budget: "1,200円から",
            },
            {
                name: "地元の蕎麦店",
                description: "手打ちそばが自慢の落ち着いた和食処。",
                walk: "徒歩12分圏内",
                budget: "1,200円から",
            },
            {
                name: "駅前のハンバーガー",
                description: "手ごねのパティが自慢の地元ハンバーガー店。",
                walk: "徒歩5分圏内",
                budget: "1,200円から",
            },
            {
                name: "テイクアウト弁当店",
                description: "地元の食材を使ったお弁当を公園で食べるのもおすすめ。",
                walk: "徒歩8分圏内",
                budget: "800円から",
            },
            {
                name: "地元のうどん店",
                description: "コシのある手打ちうどんが楽しめる老舗。",
                walk: "徒歩10分圏内",
                budget: "900円から",
            },
        ],
        fun: [
            {
                name: "駅前ショッピングエリア",
                description:
                    "雨の日でも使いやすく、買い物や休憩がしやすい場所。",
                walk: "徒歩10分圏内",
                bestTime: "午後",
            },
            {
                name: "近くの公園",
                description: "散歩、写真、短い休憩に向いたスポット。",
                walk: "徒歩15分圏内",
                bestTime: "午前から夕方",
            },
            {
                name: "地域資料館・観光案内所",
                description: "初めての街で情報を集めるのに便利です。",
                walk: "徒歩20分圏内",
                bestTime: "昼",
            },
            {
                name: "図書館・学習施設",
                description: "静かに過ごしたい時におすすめの公共施設。",
                walk: "徒歩12分圏内",
                bestTime: "昼",
            },
            {
                name: "地域の神社・仏閣",
                description: "地元の歴史に触れられる静かなスポット。",
                walk: "徒歩15分圏内",
                bestTime: "午前",
            },
            {
                name: "商店街アーケード",
                description: "天候を気にせず散策できる屋根付きの商店街。",
                walk: "徒歩8分圏内",
                bestTime: "昼から夕方",
            },
            {
                name: "健康温泉・銭湯",
                description: "旅の疲れを癒せる地元の温浴施設。",
                walk: "徒歩15分圏内",
                bestTime: "夕方から夜",
            },
            {
                name: "サイクリングコース",
                description: "レンタサイクルで巡る地域の名所めぐり。",
                walk: "徒歩20分圏内",
                bestTime: "午前",
            },
            {
                name: "地元の市場",
                description: "新鮮な食材や軽食が楽しめる朝市・夕市。",
                walk: "徒歩10分圏内",
                bestTime: "午前",
            },
            {
                name: "フィットネス・運動施設",
                description: "天気に関係なく体を動かせる屋内施設。",
                walk: "徒歩15分圏内",
                bestTime: "いつでも",
            },
        ],
        plan: [
            {
                time: "11:30",
                title: "駅周辺でランチ",
                note: "地元らしい店を選ぶ。",
            },
            {
                time: "13:00",
                title: "商店街や公園を散歩",
                note: "徒歩圏の雰囲気を見る。",
            },
            {
                time: "15:00",
                title: "カフェで休憩",
                note: "次の予定を確認する。",
            },
        ],
    },
};

const navItems = [
    { id: "overview", label: "車両管理", icon: LayoutDashboard },
    { id: "analytics", label: "販売分析", icon: BarChart3 },
    { id: "calendar", label: "カレンダー", icon: CalendarDays },
    { id: "makers", label: "メーカー情報", icon: Tags },
];

const apiStatusLabel = computed(() =>
    apiConnected.value ? "Spring API 接続中" : "デモデータ表示",
);
const pageTitle = computed(
    () =>
        navItems.find((item) => item.id === currentView.value)?.label ||
        "車両管理",
);
const activeApp = computed(() =>
    currentPath.value.startsWith("/test2") ? "guide" : "vehicle",
);
const selectedGuideArea = computed(() => {
    if (apiGuideData.value) {
        return {
            name: `${apiGuideData.value.stationName} 周辺`,
            keywords: [],
            food: apiGuideData.value.food || [],
            fun: apiGuideData.value.fun || [],
            plan: [],
        };
    }
    return selectedGuideKey.value === "stationFallback"
        ? createGenericStationGuide(extractStationName(guideAddress.value))
        : guideAreas[selectedGuideKey.value] || guideAreas.default;
});
const buildGuideSpot = (spot, type, index) => {
    const walkMinutes = spot.walk
        ? parseWalkMinutes(spot.walk)
        : 5 + index * 3;
    return {
        ...spot,
        id: `${selectedGuideArea.value.name}-${type}-${spot.name}`,
        type,
        typeLabel: type === "food" ? "グルメ" : "遊び",
        distance: `${Math.max(2, walkMinutes + index)}分`,
        rating: spot.rating
            ? Number(spot.rating).toFixed(1)
            : (4.2 + ((index + (type === "fun" ? 2 : 0)) % 5) * 0.1).toFixed(1),
        openLabel: spot.openNow !== undefined
            ? spot.openNow ? "営業中" : "営業時間確認"
            : index % 3 === 2 ? "営業時間確認" : "営業中目安",
        tag: type === "food" ? (spot.budget || spot.tag || "要確認") : (spot.bestTime || "要確認"),
        walkMinutes,
    };
};
const guideSpots = computed(() => {
    const area = selectedGuideArea.value;
    if (!area) return [];
    return [
        ...(area.food || []).map((spot, index) =>
            buildGuideSpot(spot, "food", index),
        ),
        ...(area.fun || []).map((spot, index) =>
            buildGuideSpot(spot, "fun", index),
        ),
    ];
});
const filteredGuideSpots = computed(() =>
    guideSpots.value
        .filter(
            (spot) =>
                guideCategory.value === "all" ||
                spot.type === guideCategory.value,
        )
        .sort((a, b) => a.walkMinutes - b.walkMinutes),
);
const nearestGuideSpot = computed(() => filteredGuideSpots.value[0] || null);
const averageGuideRating = computed(() => {
    if (!filteredGuideSpots.value.length) return "-";
    const total = filteredGuideSpots.value.reduce(
        (sum, spot) => sum + Number(spot.rating),
        0,
    );
    return (total / filteredGuideSpots.value.length).toFixed(1);
});
const favoriteGuideSpots = computed(() =>
    guideSpots.value.filter((spot) => favoriteSpotIds.value.includes(spot.id)),
);
const activeGuideCategoryLabel = computed(
    () =>
        guideCategoryOptions.find(
            (option) => option.value === guideCategory.value,
        )?.label || "すべて",
);
const makers = computed(() =>
    masterMakers.value.length
        ? masterMakers.value.map((maker) => maker.name)
        : [...new Set(vehicles.value.map((vehicle) => vehicle.maker))].sort(),
);
const stores = computed(() =>
    masterStores.value.length
        ? masterStores.value.map((store) => store.name)
        : [...new Set(vehicles.value.map((vehicle) => vehicle.store))].sort(),
);
const statusOptions = computed(() =>
    masterStatuses.value.length
        ? masterStatuses.value.map((status) => status.code)
        : fallbackStatusOptions,
);
const statusLabels = computed(() => {
    if (!masterStatuses.value.length) return fallbackStatusLabels;
    return masterStatuses.value.reduce((labels, status) => {
        labels[status.code] = status.label;
        return labels;
    }, {});
});

const filteredVehicles = computed(() => {
    const keyword = query.value.toLowerCase();
    return vehicles.value.filter((vehicle) => {
        const matchQuery = [
            vehicle.name,
            vehicle.stockNo,
            vehicle.store,
            vehicle.maker,
            vehicle.color,
        ].some((value) => String(value).toLowerCase().includes(keyword));
        const matchMaker =
            makerFilter.value === "all" || vehicle.maker === makerFilter.value;
        const matchStatus =
            statusFilter.value === "all" ||
            vehicle.status === statusFilter.value;
        return matchQuery && matchMaker && matchStatus;
    });
});

const availableCount = computed(
    () =>
        vehicles.value.filter((vehicle) => vehicle.status === "available")
            .length,
);
const attentionCount = computed(
    () =>
        vehicles.value.filter(
            (vehicle) =>
                vehicle.status === "maintenance" ||
                vehicle.mileage >= 45000 ||
                isInspectionSoon(vehicle.inspection),
        ).length,
);
const averagePrice = computed(() => {
    if (!vehicles.value.length) return 0;
    return Math.round(
        vehicles.value.reduce(
            (sum, vehicle) => sum + Number(vehicle.price),
            0,
        ) / vehicles.value.length,
    );
});

const stats = computed(() => [
    {
        label: "在庫総数",
        value: vehicles.value.length,
        note: `${makers.value.length} メーカー`,
        icon: Car,
        tone: "blue",
    },
    {
        label: "販売中",
        value: availableCount.value,
        note: "掲載可能な車両",
        icon: Gauge,
        tone: "green",
    },
    {
        label: "平均価格",
        value: formatPrice(averagePrice.value),
        note: "現在の在庫から算出",
        icon: CalendarClock,
        tone: "amber",
    },
    {
        label: "要確認",
        value: attentionCount.value,
        note: "整備、車検、走行距離",
        icon: TriangleAlert,
        tone: "red",
    },
]);

const lowMileageVehicles = computed(() =>
    [...vehicles.value].sort((a, b) => a.mileage - b.mileage).slice(0, 5),
);

const priceBuckets = computed(() => {
    const buckets = [
        { label: "400万円+", min: 4000000, max: Number.POSITIVE_INFINITY },
        { label: "300-399", min: 3000000, max: 3999999 },
        { label: "200-299", min: 2000000, max: 2999999 },
        { label: "100-199", min: 1000000, max: 1999999 },
        { label: "0-99", min: 0, max: 999999 },
    ];
    const total = vehicles.value.length || 1;
    return buckets.map((bucket) => {
        const count = vehicles.value.filter(
            (vehicle) =>
                vehicle.price >= bucket.min && vehicle.price <= bucket.max,
        ).length;
        return { ...bucket, count, percent: Math.round((count / total) * 100) };
    });
});

const makerSummary = computed(() =>
    makers.value.map((maker) => {
        const members = vehicles.value.filter(
            (vehicle) => vehicle.maker === maker,
        );
        const averagePrice = members.length
            ? Math.round(
                  members.reduce(
                      (sum, vehicle) => sum + Number(vehicle.price),
                      0,
                  ) / members.length,
              )
            : 0;
        return { maker, count: members.length, averagePrice };
    }),
);

const weekLabels = [
    { key: "sun", label: "日" },
    { key: "mon", label: "月" },
    { key: "tue", label: "火" },
    { key: "wed", label: "水" },
    { key: "thu", label: "木" },
    { key: "fri", label: "金" },
    { key: "sat", label: "土" },
];

const calendarEvents = {
    2: "仕入会議",
    4: "展示場点検",
    7: "商談予約",
    11: "納車準備",
    14: "オークション",
    18: "車検確認",
    21: "販売会議",
    25: "広告更新",
    28: "棚卸",
};

const calendarDays = computed(() => {
    const days = [];
    let date = 1;
    for (let week = 0; week < 5; week += 1) {
        for (const day of weekLabels) {
            const isBlank = week === 0 && day.key === "sun";
            const currentDate = isBlank || date > 30 ? "" : date;
            days.push({
                ...day,
                week,
                date: currentDate,
                event: currentDate
                    ? calendarEvents[currentDate] || "予定なし"
                    : "",
            });
            if (currentDate) date += 1;
        }
    }
    return days;
});

const visibleWeekLabels = computed(() =>
    weekLabels.filter(
        (day) => !calendarSaturdayHidden.value || day.key !== "sat",
    ),
);
const visibleCalendarDays = computed(() =>
    calendarDays.value.filter(
        (day) => !calendarSaturdayHidden.value || day.key !== "sat",
    ),
);

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const handleLogoClick = () => {
    if (isSidebarCollapsed.value) {
        calendarSaturdayHidden.value = true;
    }
    currentView.value = "overview";
};

const goToPath = (path) => {
    window.history.pushState({}, "", path);
    currentPath.value = window.location.pathname;
    if (path === "/test") {
        document.title = "中古車管理システム";
    } else {
        document.title = "近くのグルメ・遊び案内";
    }
};

const rememberGuideSearch = (keyword) => {
    const value = keyword.trim();
    if (!value) return;
    guideHistory.value = [
        value,
        ...guideHistory.value.filter((item) => item !== value),
    ].slice(0, 6);
    writeStoredArray("guideHistory", guideHistory.value);
};

const setQuickStation = (station) => {
    guideAddress.value = station;
    searchLocalSpots();
};

const toggleFavoriteSpot = (spot) => {
    favoriteSpotIds.value = favoriteSpotIds.value.includes(spot.id)
        ? favoriteSpotIds.value.filter((id) => id !== spot.id)
        : [spot.id, ...favoriteSpotIds.value].slice(0, 12);
    writeStoredArray("guideFavorites", favoriteSpotIds.value);
};

const isFavoriteSpot = (spot) => favoriteSpotIds.value.includes(spot.id);

const searchLocalSpots = async () => {
    const keyword = guideAddress.value.trim();
    const normalizedKeyword = normalizeGuideKeyword(keyword);
    if (!keyword) {
        selectedGuideKey.value = "default";
        return;
    }
    apiGuideData.value = null;
    isSearchingPlaces.value = true;
    try {
        const response = await fetch(`${placesApiUrl}?query=${encodeURIComponent(keyword)}&maxResults=20`);
        if (response.ok) {
            const data = await response.json();
            if (data.food?.length || data.fun?.length) {
                apiGuideData.value = data;
                rememberGuideSearch(keyword);
                return;
            }
        }
    } catch {
    } finally {
        isSearchingPlaces.value = false;
    }
    const matches = Object.entries(guideAreas)
        .filter(([key]) => key !== "default")
        .map(([key, area]) => {
            const matchedWord = area.keywords
                .filter((word) =>
                    normalizedKeyword.includes(normalizeGuideKeyword(word)),
                )
                .sort((a, b) => b.length - a.length)[0];
            return { key, score: matchedWord?.length || 0 };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score);
    selectedGuideKey.value =
        matches[0]?.key ||
        (keyword.includes("駅") ? "stationFallback" : "default");
    rememberGuideSearch(keyword);
};

const todos = computed(() => [
    {
        title: `${vehicles.value.filter((vehicle) => isInspectionSoon(vehicle.inspection)).length} 台の車検が近づいています`,
        desc: "車検期限を確認し、販売説明に反映してください",
        icon: CalendarClock,
    },
    {
        title: `${vehicles.value.filter((vehicle) => vehicle.status === "maintenance").length} 台が整備中です`,
        desc: "整備完了後に販売ステータスを更新できます",
        icon: Wrench,
    },
    {
        title: `${vehicles.value.filter((vehicle) => vehicle.mileage >= 45000).length} 台が高走行です`,
        desc: "保証条件や点検履歴の確認をおすすめします",
        icon: TriangleAlert,
    },
]);

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const loadVehicles = async () => {
    isLoading.value = true;
    try {
        vehicles.value = (await requestJson(apiUrl)).map(normalizeVehicle);
        apiConnected.value = true;
        apiError.value = "";
    } catch {
        vehicles.value = seedVehicles.map(normalizeVehicle);
        apiConnected.value = false;
        apiError.value =
            "Spring Boot API に接続できないため、デモデータを表示しています。backend を起動すると DB データに切り替わります。";
    } finally {
        isLoading.value = false;
    }
};

const loadMasterData = async () => {
    try {
        const masterData = await requestJson(masterDataUrl);
        masterMakers.value = masterData.makers || [];
        masterStores.value = masterData.stores || [];
        masterStatuses.value = masterData.statuses || [];
    } catch {
        masterMakers.value = [];
        masterStores.value = [];
        masterStatuses.value = [];
    }
};

const resetForm = (values) => {
    Object.assign(form, emptyForm(), values);
};

const openCreateModal = () => {
    editingId.value = null;
    resetForm();
    if (makers.value[0]) form.maker = makers.value[0];
    if (stores.value[0]) form.store = stores.value[0];
    isModalOpen.value = true;
};

const openEditModal = (vehicle) => {
    editingId.value = vehicle.id;
    resetForm(vehicle);
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
};

const saveVehicle = async () => {
    const payload = {
        ...form,
        year: Number(form.year),
        mileage: Math.max(0, Number(form.mileage)),
        price: Math.max(0, Number(form.price)),
    };
    rememberVehicleColor(payload);

    if (apiConnected.value) {
        if (editingId.value) {
            await requestJson(`${apiUrl}/${editingId.value}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            await requestJson(apiUrl, {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }
        await loadVehicles();
    } else if (editingId.value) {
        vehicles.value = vehicles.value.map((vehicle) =>
            vehicle.id === editingId.value
                ? { ...vehicle, ...payload }
                : vehicle,
        );
    } else {
        vehicles.value = [{ id: Date.now(), ...payload }, ...vehicles.value];
    }

    closeModal();
};

const removeVehicle = async (id) => {
    const target = vehicles.value.find((vehicle) => vehicle.id === id);
    if (!target || !window.confirm(`${target.name} の記録を削除しますか？`))
        return;

    if (apiConnected.value) {
        await requestJson(`${apiUrl}/${id}`, { method: "DELETE" });
        await loadVehicles();
    } else {
        vehicles.value = vehicles.value.filter((vehicle) => vehicle.id !== id);
    }
};

const statusTone = (status) => {
    if (status === "available") return "ok";
    if (status === "sold") return "pending";
    return "danger";
};

const formatPrice = (value) =>
    new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0,
    }).format(Number(value));

const formatMileage = (value) =>
    `${new Intl.NumberFormat("ja-JP").format(Number(value))} km`;

const isInspectionSoon = (value) => {
    const [year, month] = String(value).split("/").map(Number);
    if (!year || !month) return false;
    const inspectionDate = new Date(year, month - 1, 1);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 6);
    return inspectionDate <= threshold;
};

const exportVehicles = () => {
    const header = [
        "車名",
        "管理番号",
        "メーカー",
        "年式",
        "色",
        "走行距離",
        "価格",
        "状態",
        "店舗",
        "燃料",
        "ミッション",
        "車検",
    ];
    const rows = vehicles.value.map((vehicle) => [
        vehicle.name,
        vehicle.stockNo,
        vehicle.maker,
        vehicle.year,
        vehicle.color || "未設定",
        vehicle.mileage,
        vehicle.price,
        statusLabels.value[vehicle.status],
        vehicle.store,
        vehicle.fuel,
        vehicle.transmission,
        vehicle.inspection,
    ]);
    const csv = [header, ...rows]
        .map((row) =>
            row
                .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
                .join(","),
        )
        .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "used-cars-ja.csv";
    link.click();
    URL.revokeObjectURL(link.href);
};

onMounted(async () => {
    window.addEventListener("popstate", () => {
        currentPath.value = window.location.pathname;
    });
    guideHistory.value = readStoredArray("guideHistory");
    favoriteSpotIds.value = readStoredArray("guideFavorites");
    savedVehicleColors.value = readStoredObject("vehicleColors");
    searchLocalSpots();
    document.title =
        activeApp.value === "guide"
            ? "近くのグルメ・遊び案内"
            : "中古車管理システム";
    await Promise.all([loadMasterData(), loadVehicles()]);
});
</script>
