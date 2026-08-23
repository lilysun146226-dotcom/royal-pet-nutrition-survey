import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'听见每一种喂养需求｜宠物精准营养调研',description:'面向猫犬宠物主的匿名营养需求调研与实时统计看板。',openGraph:{title:'听见每一种喂养需求',description:'3分钟宠物精准营养匿名调研'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
