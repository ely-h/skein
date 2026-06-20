import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import type { Project } from '../types/index';

export async function exportToPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureGantt(element);
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

async function captureGantt(element: HTMLElement): Promise<string> {
  const scrollPanel = element.querySelector('[data-timeline-scroll]') as HTMLElement | null;
  const contentDiv  = element.querySelector('[data-timeline-content]') as HTMLElement | null;

  // Mesurer AVANT de toucher aux styles
  const contentW = scrollPanel ? scrollPanel.scrollWidth : element.scrollWidth;
  const contentH = contentDiv  ? contentDiv.offsetHeight : element.scrollHeight;

  // Snapshot
  const outerCss  = element.style.cssText;
  const panelCss  = scrollPanel?.style.cssText ?? '';

  // Forcer les dimensions exactes du contenu
  element.style.cssText = `overflow:visible;flex:none;width:${contentW}px;height:${contentH}px;`;

  if (scrollPanel) {
    scrollPanel.style.cssText = `flex:none;overflow:visible;width:${contentW}px;height:${contentH}px;`;
  }

  // Forcer le reflow avant la capture
  void element.offsetHeight;

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    width:  contentW,
    height: contentH,
  });

  // Restaurer
  element.style.cssText = outerCss;
  if (scrollPanel) scrollPanel.style.cssText = panelCss;

  return dataUrl;
}

export async function exportToPdf(element: HTMLElement, projectName: string): Promise<void> {
  const dataUrl = await captureGantt(element);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const marginX = 10;
        const titleH  = 16;
        const availW  = pageW - marginX * 2;
        const availH  = pageH - titleH - 10;

        const ratio  = img.width / img.height;
        let drawW    = availW;
        let drawH    = drawW / ratio;
        if (drawH > availH) {
          drawH = availH;
          drawW = drawH * ratio;
        }

        pdf.setFontSize(13);
        pdf.text(projectName, marginX, 10);
        pdf.addImage(dataUrl, 'PNG', marginX, titleH, drawW, drawH);
        pdf.save(`${projectName}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function exportToJson(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${project.name}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
