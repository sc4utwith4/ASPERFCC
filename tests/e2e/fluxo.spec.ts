/// <reference lib="dom" />
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Coleta erros de página e de console para a asserção final de cada teste. */
function coletarErros(page: Page): string[] {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text());
  });
  return erros;
}

/** Abre uma rota e espera o banco ser semeado (o título da tela só aparece depois do seed). */
async function abrir(page: Page, rota = "/"): Promise<void> {
  await page.goto(rota);
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 90_000 });
}

/** Responde a questão aberta só pelo teclado: risca D, marca a letra, confiança, confirma e avança. */
async function responderPorTeclado(page: Page, letra: string, confianca: "1" | "2" | "3", riscar = false): Promise<void> {
  const alternativas = page.getByRole("radiogroup", { name: "Alternativas" });
  await expect(alternativas).toBeVisible();
  if (riscar) {
    await page.keyboard.press("Shift+D");
    await expect(alternativas.getByRole("radio").nth(3)).toHaveAccessibleName(/riscada/);
  }
  await page.keyboard.press(letra);
  await expect(alternativas.getByRole("radio", { checked: true })).toHaveCount(1);
  await page.keyboard.press(confianca);
  await page.keyboard.press("Enter");
}

const DIA = (d: number) => new Date(`2026-11-${String(d).padStart(2, "0")}T13:00:00Z`);

test("primeiro acesso semeia o banco e todas as telas abrem sem erro", async ({ page }) => {
  const erros = coletarErros(page);
  await abrir(page);
  for (const rota of ["/materias", "/materias/seguranca-informacao", "/radar", "/revisao", "/caderno-revisao", "/flashcards", "/notas", "/discursiva", "/simulado", "/lotes", "/config"]) {
    await page.goto(rota);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(erros).toEqual([]);
});

test("bloco de 10 pelo teclado → debrief → consolidar → revisão nos 3 modos nos dias seguintes", async ({ page }) => {
  const erros = coletarErros(page);
  await page.clock.setFixedTime(DIA(2));
  await abrir(page, "/materias/seguranca-informacao");

  await page.getByText("10 questões", { exact: true }).click();
  await page.getByRole("button", { name: /Começar bloco/ }).click();
  for (let i = 0; i < 10; i++) {
    await responderPorTeclado(page, i % 2 ? "a" : "b", String((i % 3) + 1) as "1" | "2" | "3", i === 0);
    await expect(page.getByText("Pegadinha FCC")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Pegadinha FCC")).toHaveCount(0);
  }

  // Daily Debrief: diagnóstico, dossiê e consolidação em pacote SRS.
  await expect(page.getByText("Conclusão diária")).toBeVisible();
  await expect(page.getByText(/Dossiê de pegadinhas/i)).toBeVisible();
  await page.getByRole("button", { name: /Consolidar dia/ }).click();
  await expect(page.getByText(/viraram um pacote de revisão/)).toBeVisible();

  // Caderno de Revisão recebe os erros e acertos frágeis.
  await page.goto("/caderno-revisao");
  await expect(page.getByText(/seg-info-\d{3}/).first()).toBeVisible();

  // Dia seguinte (+1): modo 1, erros + frágeis, pelo teclado.
  await page.clock.setFixedTime(DIA(3));
  await page.goto("/revisao");
  await page.getByRole("button", { name: "Revisar" }).first().click();
  await page.getByRole("button", { name: /Começar/ }).first().click();
  for (let i = 0; i < 12; i++) {
    if (await page.getByText("Etapa concluída").isVisible()) break;
    await responderPorTeclado(page, "c", "1");
    await expect(page.getByText("Pegadinha FCC")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Pegadinha FCC")).toHaveCount(0);
  }
  await expect(page.getByText("Etapa concluída")).toBeVisible();

  // Etapa seguinte (vencida): modo 2, flashcards (Espaço vira, 1–3 avaliam).
  await page.clock.setFixedTime(DIA(6));
  await page.goto("/revisao");
  await page.getByRole("button", { name: "Revisar" }).first().click();
  await page.getByRole("button", { name: /Começar/ }).nth(1).click();
  for (let i = 0; i < 12; i++) {
    if (await page.getByText("Etapa concluída").isVisible()) break;
    const contador = await page.getByText(/Cartão \d+ de \d+/).textContent();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: /^Bom/ })).toBeVisible();
    await page.keyboard.press("2");
    await expect(page.getByText("Etapa concluída").or(page.getByText(/Cartão \d+ de \d+/).filter({ hasNotText: contador ?? "" }))).toBeVisible();
  }
  await expect(page.getByText("Etapa concluída")).toBeVisible();

  // Etapa seguinte: modo 3, refazer a bateria em simulado cronometrado, sem feedback.
  await page.clock.setFixedTime(DIA(12));
  await page.goto("/revisao");
  await page.getByRole("button", { name: "Revisar" }).first().click();
  await page.getByRole("button", { name: /Começar/ }).nth(2).click();
  for (let i = 0; i < 3; i++) {
    await responderPorTeclado(page, "a", "2");
    await expect(page.getByText(`${i + 1}/10 respondidas`)).toBeVisible();
  }
  await expect(page.getByText("Pegadinha FCC")).toHaveCount(0);
  await page.getByRole("button", { name: "Encerrar", exact: true }).click();
  await page.getByRole("button", { name: "Encerrar e ver resultado" }).click();
  await expect(page.getByText("Etapa concluída")).toBeVisible();

  // A partir da 2ª etapa o Modo Mutação vem ligado: a questão aparece como caça ao erro, versão invertida ou justificativa.
  await page.clock.setFixedTime(DIA(28));
  await page.goto("/revisao");
  await page.getByRole("button", { name: "Revisar" }).first().click();
  await expect(page.getByRole("switch", { name: /Modo Mutação/ })).toBeChecked();
  await page.getByRole("button", { name: /Começar/ }).first().click();
  await expect(page.getByText(/Marque exatamente os itens INCORRETOS|Aponte a fiel|justifique por escrito/)).toBeVisible();

  // Radar reflete o progresso.
  await page.goto("/radar");
  await expect(page.getByRole("heading", { name: "Radar do Edital" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Segurança/ })).toContainText("10/50");
  expect(erros).toEqual([]);
});

test("conforto visual: tema escuro, filtro âmbar, Zen e timer sem tremer", async ({ page }) => {
  const erros = coletarErros(page);
  await abrir(page);

  await page.getByRole("button", { name: /Conforto visual/i }).click();
  await page.getByRole("radio", { name: /Ardósia \(noite\)/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#temperatura").fill("0.2");
  await expect(page.locator(".temperature-overlay")).toBeAttached();
  await page.keyboard.press("Escape");

  // Zen: Alt+Z esconde navegação e painel; de novo, volta.
  await page.locator("body").click({ position: { x: 600, y: 400 } });
  await page.keyboard.press("Alt+KeyZ");
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
  await page.keyboard.press("Alt+KeyZ");
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();

  // Timer: largura constante enquanto os dígitos mudam (tabular-nums).
  await page.getByRole("button", { name: "Iniciar timer" }).click();
  const visor = page.locator("header span.dado").first();
  const leituras: { texto: string; largura: number }[] = [];
  for (let i = 0; i < 4; i++) {
    leituras.push({ texto: (await visor.textContent()) ?? "", largura: Math.round((await visor.boundingBox())!.width * 10) / 10 });
    await page.waitForTimeout(1100);
  }
  expect(new Set(leituras.map((l) => l.texto)).size).toBeGreaterThan(1);
  expect(new Set(leituras.map((l) => l.largura)).size).toBe(1);
  expect(erros).toEqual([]);
});

test("backup: exportar e importar de volta preserva o progresso", async ({ page }, testInfo) => {
  const erros = coletarErros(page);
  await abrir(page);

  // Cria um registro identificável no Brain Dump.
  const marca = `captura e2e ${Date.now()}`;
  const brainDump = page.locator("#brain-dump");
  await brainDump.fill(marca);
  await brainDump.press("Enter");
  await expect(page.getByText(marca)).toBeVisible();

  await page.goto("/lotes");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar JSON" }).click()]);
  const arquivo = testInfo.outputPath("backup.json");
  await download.saveAs(arquivo);

  // Apaga o registro e restaura do arquivo, substituindo o banco.
  const item = page.getByRole("listitem").filter({ hasText: marca });
  await item.getByRole("button", { name: "Apagar captura" }).click();
  await expect(page.getByText(marca)).toHaveCount(0);
  await page.getByLabel("Arquivo de backup").setInputFiles(arquivo);
  await page.getByRole("button", { name: /Substituir/ }).click();
  await expect(page.getByText(/importad|restaurad/i).first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(marca)).toBeVisible();
  expect(erros).toEqual([]);
});

test("mobile 390 px: sem rolagem horizontal nas telas principais", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrir(page);
  for (const rota of ["/", "/materias/seguranca-informacao", "/radar", "/revisao", "/discursiva", "/lotes"]) {
    await page.goto(rota);
    await expect(page.locator("h1").first()).toBeVisible();
    const excesso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(excesso, `rolagem horizontal em ${rota}`).toBeLessThanOrEqual(0);
  }
});

const CASO_01 = join(__dirname, "../../src/data/casos/caso-01.json");

test("laboratório discursivo: linhas FCC, excedente desconsiderado e espelho com nota", async ({ page }) => {
  test.skip(!existsSync(CASO_01), "casos discursivos ainda não gerados");
  const caso = JSON.parse(readFileSync(CASO_01, "utf8")) as { titulo: string; limiteLinhas: number; respostaPadrao: string[] };
  const erros = coletarErros(page);
  await abrir(page, "/discursiva/caso-01");
  await expect(page.getByRole("heading", { name: caso.titulo })).toBeVisible();

  const folha = page.locator("#texto-discursiva");
  await folha.fill(caso.respostaPadrao.join("\n"));
  await expect(page.getByText(new RegExp(`Linhas: \\d+/${caso.limiteLinhas}`))).toBeVisible();
  await expect(page.getByText(/seriam desconsideradas/)).toHaveCount(0);

  // Texto acima do limite: o excedente é sinalizado como desconsiderado.
  await folha.fill(`${caso.respostaPadrao.join("\n")}\n${"Parágrafo adicional para estourar o limite de linhas da folha. ".repeat(40)}`);
  await expect(page.getByText(/linha\(s\) seriam desconsideradas/)).toBeVisible();

  // Volta à resposta-padrão, corrige pelo espelho e aplica as sugestões da detecção.
  await folha.fill(caso.respostaPadrao.join("\n"));
  await page.getByRole("button", { name: /Finalizar e corrigir pelo espelho/ }).click();
  await page.getByRole("button", { name: "Aplicar sugestões da detecção" }).click();
  const nota = page.locator("p.dado").filter({ hasText: /^\d+([.,]\d)?$/ }).first();
  await expect(nota).toBeVisible();
  expect(Number((await nota.textContent())!.replace(",", "."))).toBeGreaterThanOrEqual(35);
  expect(erros).toEqual([]);
});
