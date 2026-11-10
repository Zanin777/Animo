import { describe, expect, test } from "vitest";
import { cleanSynopsis } from "./clean";

describe("sinopse", () => {
  test("texto simples passa igual", () => {
    expect(cleanSynopsis("A elfa Frieren e seus companheiros derrotaram o Rei Demônio.")).toBe(
      "A elfa Frieren e seus companheiros derrotaram o Rei Demônio.",
    );
  });
  test("tira tags, crédito da fonte e nota de rodapé (formato do AniList)", () => {
    const raw =
      "The adventure is over but life goes on for an elf mage.<br><br>\n(Source: Crunchyroll)<br><br><i>Note: Includes episode 0.</i>";
    expect(cleanSynopsis(raw)).toBe("The adventure is over but life goes on for an elf mage.");
  });
  test("spoiler do AniList some inteiro", () => {
    expect(cleanSynopsis("Um garoto encontra um caderno misterioso. ~!Ele morre no fim.!~")).toBe(
      "Um garoto encontra um caderno misterioso.",
    );
  });
  test("o que parecer HTML vira texto, nunca marcação", () => {
    const out = cleanSynopsis('Uma história <script>alert(1)</script> sobre amizade &lt;img src=x onerror=alert(1)&gt; e coragem.');
    expect(out).not.toMatch(/<script|<img/i);
    expect(out).toBe("Uma história alert(1) sobre amizade e coragem.");
  });
  test("entidades comuns e numéricas", () => {
    expect(cleanSynopsis("Tom &amp; Jerry &#8212; uma dupla que n&#227;o se entende.")).toBe("Tom & Jerry — uma dupla que não se entende.");
  });
  test("caracteres de direção e de controle saem", () => {
    expect(cleanSynopsis("Uma história‮ invertida\u0007 que não engana ninguém.")).toBe("Uma história invertida que não engana ninguém.");
  });
  test("texto longo é cortado no fim de uma frase", () => {
    const sentence = "Esta é uma frase de tamanho médio para o teste. ";
    const out = cleanSynopsis(sentence.repeat(40), 300)!;
    expect(out.length).toBeLessThanOrEqual(300);
    expect(out.endsWith("teste.")).toBe(true);
  });
  test("sem ponto final por perto, corta na palavra e põe reticências", () => {
    const out = cleanSynopsis("palavra ".repeat(200), 100)!;
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out.endsWith("palavra…")).toBe(true);
  });
  test("vazio, curto demais ou que não é texto → null", () => {
    expect(cleanSynopsis("")).toBeNull();
    expect(cleanSynopsis("<br><br>")).toBeNull();
    expect(cleanSynopsis("TBA")).toBeNull();
    expect(cleanSynopsis(null)).toBeNull();
    expect(cleanSynopsis({ text: "x" })).toBeNull();
  });
});
