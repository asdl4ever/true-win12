import type { Account } from '../types/desktop'
import { accents } from './palette'

/** 插画头像来源：小尺寸下线条清晰，色系也与空间玻璃相衬 */
const avatarUrl = (seed: string) => `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`

/** 机器上的账号：任务栏账号态展示当前账号。每个账号一套暖调强调色 */
export const accounts: Account[] = [
  {
    id: 'nailong',
    name: '奶龙',
    initial: '奶',
    role: '管理员',
    accent: accents[0].value,
    avatar: avatarUrl('Nailong'),
  },
  {
    id: 'xiaoman',
    name: '林小满',
    initial: '林',
    role: '标准用户',
    accent: accents[1].value,
    avatar: avatarUrl('Xiaoman'),
  },
  {
    id: 'ayan',
    name: '阿岩',
    initial: '岩',
    role: '标准用户',
    accent: accents[3].value,
    avatar: avatarUrl('Ayan'),
  },
]
