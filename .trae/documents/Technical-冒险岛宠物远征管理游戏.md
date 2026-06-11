## 1. 架构设计

```mermaid
graph TD
    A["Web浏览器客户端"
    subgraph B["前端展示层
    C["React 18 组件
    D["Tailwind CSS 样式
    E["动画/特效层
    F["Zustand 状态管理
    G["React Router 路由
    subgraph H["数据层
    I["游戏数据Store
    J["资源/配置数据
    K["LocalStorage 持久化
    style A fill:#4ade80
    style B fill:#60a5fa
    style C fill:#f472b6
    style D fill:#facc15
    style E fill:#fb923c
    style F fill:#f87171
    style G fill:#a78bfa
    style H fill:#10b981
    style I fill:#fbbf24
    style J fill:#60a5fa
    style K fill:#fb7185
```

## 2. 技术描述

- 前端：React@18 + TypeScript@5 + Vite@5 + Tailwind CSS@3
- 初始化工具：vite-init (react-ts 模板
- 状态管理：Zustand
- 路由：react-router-dom@6
- 图标库：lucide-react
- 动画：CSS Keyframes + Framer Motion（可选）
- 持久化：localStorage
- 后端：无后端，纯前端单机游戏

## 3. 路由定义

| 路由 | 页面用途 |
|------|----------|
| / | 重定向至码头营地 |
| /camp | 码头营地主界面 |
| /hut | 宠物小屋界面 |
| /map | 远征地图界面 |
| /workshop | 采集工坊界面 |
| /battle | 遭遇战界面 |
| /collection | 收藏册界面 |

## 4. 状态管理设计

### 4.1 游戏全局Store (useGameStore)

```typescript
interface GameState {
  // 资源
  gold: number;
  ore: number;
  herb: number;
  shell: number;
  exp: number;
  
  // 营地设施
  facilities: {
    dock: number;      // 码头等级
    warehouse: number;  // 仓库等级
    workshop: number;   // 工坊等级
    hatchery: number;   // 孵化巢等级
  };
  
  // 宠物数据
  pets: Pet[];
  eggs: Egg[];
  team: string[];  // 3只宠物ID的远征队
  
  // 远征状态
  expedition: Expedition | null;
  
  // 订单
  orders: Order[];
  
  // 收藏数据
  discoveries: Discovery[];
  islandProgress: Record<string, number>;
  logs: LogEntry[];
  
  // Actions
  addResource: (type, amount) => void;
  spendResource: (type, amount) => boolean;
  upgradeFacility: (facility) => boolean;
  hatchEgg: (eggId) => void;
  feedPet: (petId) => void;
  restPet: (petId) => void;
  setTeam: (petIds) => void;
  startExpedition: (islandId) => void;
  completeExpedition: (rewards) => void;
  collectResource: (type) => void;
  craftItem: (recipeId) => void;
  repairEquipment: (equipId) => void;
  submitOrder: (orderId) => boolean;
  addLog: (entry) => void;
  addDiscovery: (item) => void;
}
```

## 5. 数据模型

### 5.1 ER图

```mermaid
erDiagram
    PET ||--o{ EGG : "孵化自
    PET }o--|| TEAM : "属于"
    TEAM ||--|| EXPEDITION : "执行
    EXPEDITION }o--|| ISLAND : "前往
    EXPEDITION ||--o{ BATTLE : "遭遇"
    BATTLE ||--o{ LOOT : "掉落"
    PLAYER ||--o{ RESOURCE : "拥有"
    PLAYER ||--o{ ORDER : "接取"
    PLAYER ||--o{ DISCOVERY : "发现"
    PLAYER ||--|| FACILITY : "升级"
    WORKSHOP ||--o{ RECIPE : "包含"
```

### 5.2 核心TypeScript类型

```typescript
// 宠物
interface Pet {
  id: string;
  name: string;
  type: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  emoji: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  mood: number;      // 心情值 0-100
  stamina: number;   // 体力值 0-100
  skills: Skill[];
  synergyBonds: string[];  // 羁绊宠物ID
}

// 宠物蛋
interface Egg {
  id: string;
  type: Pet['type'];
  progress: number;  // 0-100
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 岛屿
interface Island {
  id: string;
  name: string;
  emoji: string;
  level: number;
  unlocked: boolean;
  x: number;
  y: number;
  specialties: ('ore' | 'herb' | 'shell')[];
  monsters: MonsterTemplate[];
  rareDrops: string[];
  description: string;
}

// 怪物
interface Monster {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  rewards: ResourceReward[];
}

// 订单
interface Order {
  id: string;
  islander: string;
  requirements: { type: ResourceType; amount: number }[];
  rewards: { type: ResourceType; amount: number }[];
  completed: boolean;
  expiresAt: number;
}

// 远征
interface Expedition {
  islandId: string;
  startTime: number;
  status: 'traveling' | 'battling' | 'collecting' | 'returning' | 'completed';
  battleWins: number;
  collected: ResourceReward[];
}

// 发现
interface Discovery {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'pet' | 'island' | 'monster' | 'treasure' | 'lore';
  description: string;
  foundAt: number;
}
```

## 6. 组件结构

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # 顶部资源栏+导航
│   │   └── PageContainer.tsx   # 页面容器
│   ├── common/
│   │   ├── ResourceBar.tsx     # 资源展示
│   │   ├── ProgressBar.tsx     # 进度条
│   │   ├── PetCard.tsx         # 宠物卡片
│   │   ├── Button.tsx          # 风格化按钮
│   │   └── Modal.tsx           # 弹窗
│   ├── camp/
│   │   ├── FacilityPanel.tsx   # 设施升级
│   │   ├── OrderBoard.tsx      # 订单板
│   │   └── Warehouse.tsx       # 仓库
│   ├── hut/
│   │   ├── Hatchery.tsx        # 孵化巢
│   │   ├── PetDetail.tsx       # 宠物详情
│   │   ├── FeedingArea.tsx     # 喂食区
│   │   └── TeamBuilder.tsx     # 编队
│   ├── map/
│   │   ├── IslandMap.tsx       # 群岛地图
│   │   ├── IslandCard.tsx      # 岛屿卡片
│   │   └── ExpeditionPanel.tsx # 派遣面板
│   ├── workshop/
│   │   ├── ResourceNode.tsx    # 采集节点
│   │   ├── CraftingTable.tsx   # 制作台
│   │   └── RepairStation.tsx   # 修复台
│   ├── battle/
│   │   ├── BattleArena.tsx     # 战斗场景
│   │   ├── SkillBar.tsx        # 技能栏
│   │   └── LootScreen.tsx      # 战利品
│   └── collection/
│       ├── PetBonds.tsx        # 宠物羁绊
│       ├── IslandProgress.tsx  # 岛屿进度
│       └── ExpeditionLog.tsx   # 远征日志
├── pages/
│   ├── Camp.tsx
│   ├── Hut.tsx
│   ├── ExpeditionMap.tsx
│   ├── Workshop.tsx
│   ├── Battle.tsx
│   └── Collection.tsx
├── store/
│   └── useGameStore.ts
├── data/
│   ├── pets.ts
│   ├── islands.ts
│   ├── monsters.ts
│   ├── recipes.ts
│   └── orders.ts
├── hooks/
│   ├── useBattle.ts
│   ├── useExpedition.ts
│   └── useAutoSave.ts
├── utils/
│   ├── battleSystem.ts
│   ├── random.ts
│   └── formatters.ts
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 7. 战斗系统设计

- 回合制自动战斗，按速度值决定行动顺序
- 每回合宠物自动普攻，玩家手动释放协同技能
- 协同技能需3只宠物能量条充满后可释放
- 属性克制：火>风>地>水>火，光暗互克
- 伤害公式：(攻击*属性倍率 - 防御/2) * 随机浮动(0.9~1.1)
- 胜利后获得经验、资源、稀有掉落物
