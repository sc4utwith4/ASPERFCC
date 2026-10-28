# Contraste dos tokens (WCAG 2.x)

Gerado por `npm run contraste` a partir de `src/design/tokens.css`. Não edite à mão.

Alvos: 7:1 (AAA) para o texto de leitura longa; 4,5:1 (AA) para texto comum; 3:1 para texto grande em negrito e para contornos e indicadores de interface (critério 1.4.11).

| Par | Claro (Warm E-Ink) | Escuro (Low-Blue Warm Slate) | Alvo | Uso |
|---|---:|---:|---:|---|
| Texto principal / canvas | 14,22:1 ok | 12,63:1 ok | 7,00:1 | leitura longa (AAA) |
| Texto principal / surface | 13,25:1 ok | 11,51:1 ok | 7,00:1 | leitura longa (AAA) |
| Texto principal / elevated | 14,74:1 ok | 10,31:1 ok | 7,00:1 | leitura longa (AAA) |
| Texto secundário / canvas | 6,60:1 ok | 6,55:1 ok | 4,50:1 | rótulos e metadados (AA) |
| Texto secundário / surface | 6,15:1 ok | 5,97:1 ok | 4,50:1 | rótulos e metadados (AA) |
| Texto secundário / elevated | 6,84:1 ok | 5,35:1 ok | 4,50:1 | rótulos e metadados (AA) |
| Sálvia (texto) / canvas | 5,39:1 ok | 6,14:1 ok | 4,50:1 | links e destaques (AA) |
| Sálvia (texto) / surface | 5,02:1 ok | 5,59:1 ok | 4,50:1 | links e destaques (AA) |
| Sálvia (texto) / elevated | 5,58:1 ok | 5,01:1 ok | 4,50:1 | links e destaques (AA) |
| Ardósia (texto) / canvas | 5,44:1 ok | 6,15:1 ok | 4,50:1 | selos informativos (AA) |
| Ardósia (texto) / surface | 5,07:1 ok | 5,60:1 ok | 4,50:1 | selos informativos (AA) |
| Ardósia (texto) / elevated | 5,64:1 ok | 5,02:1 ok | 4,50:1 | selos informativos (AA) |
| Âmbar (texto) / canvas | 5,09:1 ok | 5,96:1 ok | 4,50:1 | alertas (AA) |
| Âmbar (texto) / surface | 4,74:1 ok | 5,43:1 ok | 4,50:1 | alertas (AA) |
| Âmbar (texto) / elevated | 5,27:1 ok | 4,86:1 ok | 4,50:1 | alertas (AA) |
| Terracota (texto) / canvas | 5,36:1 ok | 5,94:1 ok | 4,50:1 | erros (AA) |
| Terracota (texto) / surface | 4,99:1 ok | 5,41:1 ok | 4,50:1 | erros (AA) |
| Terracota (texto) / elevated | 5,55:1 ok | 4,85:1 ok | 4,50:1 | erros (AA) |
| Texto principal / marca-texto ocre | 12,47:1 ok | 8,10:1 ok | 7,00:1 | trecho destacado no caderno (AAA) |
| Texto sobre sálvia (botão primário) | 5,39:1 ok | 5,15:1 ok | 4,50:1 | rótulo de botão (AA) |
| Texto sobre terracota (marca de erro) | 4,70:1 ok | 3,45:1 ok | 3,00:1 | letra em círculo, negrito (AA texto grande) |
| Contorno de campo / canvas | 3,32:1 ok | 3,84:1 ok | 3,00:1 | limite de campo, interruptor e checkbox (1.4.11) |
| Contorno de campo / surface | 3,09:1 ok | 3,50:1 ok | 3,00:1 | limite de campo, interruptor e checkbox (1.4.11) |
| Anel de foco sálvia / canvas | 5,39:1 ok | 5,15:1 ok | 3,00:1 | indicador de foco (1.4.11) |

## Informativo

| Par | Claro | Escuro | Uso |
|---|---:|---:|---|
| Texto apagado / canvas | 3,37:1 | 3,37:1 | placeholder e desabilitado (isento pela WCAG) |
| Texto apagado / surface | 3,14:1 | 3,07:1 | placeholder e desabilitado (isento pela WCAG) |
| Texto apagado / elevated | 3,49:1 | 2,75:1 | placeholder e desabilitado (isento pela WCAG) |

O spec pedia contraste "em torno de 12,5:1" para o texto principal. Os hex exigidos medem o valor da primeira linha da tabela, acima disso no claro e um pouco abaixo no escuro, e ficam acima de AAA nos dois temas.
