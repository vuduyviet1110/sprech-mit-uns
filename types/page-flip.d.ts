declare module 'page-flip/dist/js/page-flip.module.js' {
  export class PageFlip {
    constructor(root: HTMLElement, settings: Record<string, number | string | boolean>)
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    on(event: 'flip' | 'changeOrientation' | 'changeState' | 'init' | 'update', cb: (e: { data: unknown }) => void): this
    getCurrentPageIndex(): number
    getPageCount(): number
    getOrientation(): 'portrait' | 'landscape'
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    flip(page: number, corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    destroy(): void
  }
}
