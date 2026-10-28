import type { RouteObject } from "react-router";
import { Shell } from "./Shell";
import { HojePage } from "@/features/hoje/HojePage";
import { MateriasPage } from "@/features/materias/MateriasPage";
import { MateriaPage } from "@/features/materias/MateriaPage";
import { ResolverPage } from "@/features/estudo/ResolverPage";
import { DebriefPage } from "@/features/debrief/DebriefPage";
import { NaoEncontrada } from "./NaoEncontrada";
import { ErroRota } from "./ErroRota";

const pagina = (carregar: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await carregar()).default });

export const rotas: RouteObject[] = [
  {
    path: "/",
    element: <Shell />,
    errorElement: <ErroRota />,
    children: [
      {
        errorElement: <ErroRota />,
        children: [
      { index: true, element: <HojePage /> },
      { path: "materias", element: <MateriasPage /> },
      { path: "materias/:slug", element: <MateriaPage /> },
      { path: "resolver/:bateriaId", element: <ResolverPage /> },
      { path: "debrief/:debriefId", element: <DebriefPage /> },
      { path: "revisao", lazy: pagina(() => import("@/features/revisao/RevisaoPage")) },
      { path: "revisao/:pacoteId", lazy: pagina(() => import("@/features/revisao/PacotePage")) },
      { path: "caderno-revisao", lazy: pagina(() => import("@/features/caderno/CadernoRevisaoPage")) },
      { path: "notas", lazy: pagina(() => import("@/features/notas/NotasPage")) },
      { path: "flashcards", lazy: pagina(() => import("@/features/flashcards/FlashcardsPage")) },
      { path: "discursiva", lazy: pagina(() => import("@/features/discursiva/DiscursivaPage")) },
      { path: "discursiva/:casoId", lazy: pagina(() => import("@/features/discursiva/CasoPage")) },
      { path: "radar", lazy: pagina(() => import("@/features/radar/RadarPage")) },
      { path: "simulado", lazy: pagina(() => import("@/features/simulado/SimuladoPage")) },
      { path: "simulado/:bateriaId", lazy: pagina(() => import("@/features/simulado/SimuladoExecucaoPage")) },
      { path: "lotes", lazy: pagina(() => import("@/features/lotes/LotesPage")) },
      { path: "config", lazy: pagina(() => import("@/features/config/ConfigPage")) },
      { path: "*", element: <NaoEncontrada /> },
        ],
      },
    ],
  },
];
