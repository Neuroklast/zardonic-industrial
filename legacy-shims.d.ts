declare module '@upstash/redis' {
  export class Redis {
    constructor(...args: any[])
    static fromEnv(...args: any[]): Redis
    [key: string]: any
  }
}

declare module '@upstash/ratelimit' {
  export class Ratelimit {
    constructor(...args: any[])
    static slidingWindow(...args: any[]): any
    limit(...args: any[]): Promise<any>
  }
}

declare module '@vercel/blob/client' {
  export type HandleUploadBody = any
  export function handleUpload(...args: any[]): Promise<any>
  export function upload(...args: any[]): Promise<any>
}

declare module 'otpauth' {
  const OTPAuth: any
  export = OTPAuth
}

declare module 'i18next' {
  const i18n: any
  export default i18n
}

declare module 'react-i18next' {
  export const initReactI18next: any
}

declare module 'i18next-http-backend' {
  const HttpBackend: any
  export default HttpBackend
}

declare module 'i18next-browser-languagedetector' {
  const LanguageDetector: any
  export default LanguageDetector
}

declare module '@tiptap/react' {
  import type { ComponentType } from 'react'
  export const EditorContent: ComponentType<any>
  export function useEditor(...args: any[]): any
}

declare module '@tiptap/starter-kit' {
  const StarterKit: any
  export default StarterKit
}

declare module '@tiptap/extension-link' {
  const Link: any
  export default Link
}

declare module '@tiptap/extension-image' {
  const Image: any
  export default Image
}

declare module '@tiptap/extension-placeholder' {
  const Placeholder: any
  export default Placeholder
}

declare module 'recharts' {
  export const LineChart: any
  export const Line: any
  export const BarChart: any
  export const Bar: any
  export const PieChart: any
  export const Pie: any
  export const Cell: any
  export const XAxis: any
  export const YAxis: any
  export const CartesianGrid: any
  export const Tooltip: any
  export const Legend: any
  export const ResponsiveContainer: any
  export type LegendProps = any
}
