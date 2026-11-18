# InterClaude (plugin Claude Code)

InterClaude to sposób, w jaki agenci Claude ludzi z zespołu TasteRay zlecają sobie zadania przez zespół **InterClaude** w Linear. Ten plugin daje dwie rzeczy:

1. **Kanał** (channel, research preview Claude Code): budzi Twoją działającą sesję Claude Code, gdy w Linear dzieje się coś dla Twojego agenta. Zdarzenia przychodzą z huba `interclaude-hub` (Cloudflare Worker) przez WebSocket.
2. **Skill `/interclaude:inbox`**: procedura sprawdzenia skrzynki przez Twoje narzędzia Linear. Działa także bez huba.

## Do czego służy

Agent jednej osoby zleca pracę agentowi drugiej osoby. Każde zlecenie najpierw zatwierdza człowiek, który za nie odpowiada.

1. **Zadanie, które wymaga cudzego sprzętu albo dostępu.** Agent jednej osoby potrzebuje testu na telefonie testowym, który ma ktoś inny. Zakłada zadanie w IC przypisane do tej osoby. Ona je zatwierdza, jej agent robi test i oddaje wynik ze zrzutami, a agent zlecającego sam aktualizuje swój ticket.
2. **Dopytanie między agentami.** W trakcie zadania agent pisze w komentarzu „Pytanie do Claude (<imię>): …”. Hub budzi drugiego agenta, ten odpowiada, a pierwszy wraca do pracy. Ludzie nie muszą w tym uczestniczyć.
3. **Przekazanie danych.** Agent ma wyniki, które przydadzą się komuś innemu: logi, liczby z PostHoga, diff, raport. Zakłada zadanie z załącznikiem dla agenta tej osoby, a ten wciąga je do swojej pracy.
4. **Podział większej roboty.** Kiedy zmiana dotyczy dwóch repozytoriów (np. `tasteray-mvp` i `tasteray-postman`), agent jednej osoby robi swoją część i zleca drugą agentowi osoby, która ma tamto repo i kontekst. Wynik odbiera do sprawdzenia.
5. **Praca, gdy nikogo nie ma przy komputerze.** Zlecenie czeka w hubie do 7 dni. Gdy dana osoba włączy sesję z kanałem, agent od razu dostaje zaległe zadania.
6. **Zadania dla wspólnego Claude na Slacku.** Zadanie z etykietą `interclaude-slack` trafia do Claude w kanale #agents, który ma dostępy kanału (repozytoria, Sentry, PostHog, Cloudflare). Przykład: „sprawdź CI w PR”. Hub sam woła Claude na #agents dopiero wtedy, gdy ma ustawiony `SLACK_BOT_TOKEN`. Bez tokenu trzeba go zawołać ręcznie.

**Kontrola człowieka w każdym przypadku:** zatwierdzenie przed startem (Do akceptacji → Zatwierdzone), odpowiedź, gdy agent wyraźnie o coś prosi, i zamknięcie po sprawdzeniu (Do sprawdzenia → Gotowe). Cała rozmowa agentów zostaje w komentarzach zadania w Linear.

**Czego nie robi:** nie zastępuje szybkiego czatu na żywo, bo każda wymiana to zadanie albo komentarz. Nie budzi agentów w aplikacji Claude (czat, Cowork), tylko w Claude Code. W aplikacji agent obsługuje zadania przez connector Lineara, gdy się go o to poprosi.

## Jak to działa po kolei

1. Ktoś (człowiek albo jego agent) zakłada zadanie w zespole InterClaude i przypisuje je do Ciebie. Zadanie trafia do **Do akceptacji**.
2. Człowiek przesuwa je na **Zatwierdzone**. Linear wysyła webhook do huba.
3. Hub wysyła zdarzenie `task_approved` do Twojej sesji. Claude czyta zadanie, przesuwa je na **W toku**, robi je, komentuje wynik i przesuwa na **Do sprawdzenia**.
4. Hub wysyła `task_ready_for_review` do osoby, która zleciła zadanie. Jej agent streszcza wynik, a ona przesuwa zadanie na **Gotowe** albo **Odrzucone** (wtedy Twój agent dostaje `task_closed`).
5. Pytania w komentarzach (`Pytanie do Claude (<imię>): ...`) trafiają jako zdarzenie `comment` do wykonawcy albo do zlecającego, zależnie od tego, kto pisze.
6. Zadania z etykietą `interclaude-slack` są dla wspólnego Claude na Slacku: hub pisze wtedy na #agents z @-wzmianką Claude.

Zasady dla agentów są w zadaniu **IC-1** ("Instrukcja dla agentów"). Agent bierze tylko zadania w **Zatwierdzone** przypisane do swojego człowieka.

**Jedna sesja z kanałem na osobę.** Jeśli uruchomisz kilka sesji z kanałem InterClaude, zdarzenia dostaje tylko najnowsza (ostatnio połączona). Starsze zostają podłączone, ale bezczynne; gdy najnowsza się zamknie, przejmuje następna. Dzięki temu dwie sesje nie wezmą tego samego zadania.

Zdarzenia, które przyszły, gdy żadna sesja nie była podłączona, czekają w hubie do 7 dni (maksymalnie 200) i przychodzą przy następnym połączeniu. Można je też pobrać narzędziem `inbox`.

## Instalacja (każda osoba)

Wymagany [Bun](https://bun.sh) i Claude Code z dostępem do channels.

```text
/plugin marketplace add tasteray/skills
/plugin install interclaude@tasteray-skills
```

Uruchom sesję z kanałem:

```bash
claude --channels plugin:interclaude@tasteray-skills
```

Dopóki plugin nie jest na liście `allowedChannelPlugins` organizacji, do testów użyj:

```bash
claude --dangerously-load-development-channels plugin:interclaude@tasteray-skills
```

Za pierwszym razem plugin otworzy przeglądarkę: logujesz się do Linear, a token huba zapisuje się w `~/.claude/channels/interclaude/token` (uprawnienia 0600). Można to powtórzyć narzędziem `login` (poproś Claude: "zaloguj InterClaude").

## Bez huba albo jako zapas

Skill działa przez Linear, więc można go też uruchamiać cyklicznie:

```text
/loop 5m /interclaude:inbox
```

Gdy nic nie ma, skill nic nie pisze.

## Konfiguracja

| Zmienna | Domyślnie | Po co |
|---|---|---|
| `INTERCLAUDE_HUB_URL` | adres Workera `interclaude-hub` | inny hub, np. preview albo lokalny `wrangler dev` |

## Rozwój

```bash
bun install
bun test
bunx tsc --noEmit
claude plugin validate .
```
