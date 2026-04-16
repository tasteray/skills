# Strategia T-Mobile Streaming — Plan Pitchu

Deutsche Telekom / zespol Future of TV. Pitch 10-minutowy.

---

## Problem

T-Mobile sprzedaje pakiety streamingowe. Uzytkownicy placa, ale nie korzystaja. Algorytm kazdej platformy widzi tylko swoj wlasny silos — Netflix nie wie, co ogladasz na Disney+, i odwrotnie. Nikt nie rozwiazuje cross-platformowego odkrywania tresci dla uzytkownika.

---

## Piec Argumentow

**1. T-Mobile jest jedynym graczem, ktory widzi uzytkownika w poprzek platform.**
Algorytmy platform sa odizolowane. T-Mobile ma relacje z uzytkownikiem ponad platformami. TasteRay zamienia te unikalna pozycje w konkretna przewage produktowa.

**2. Niskie zaangazowanie = wysoki churn. Lepsze rekomendacje bezposrednio go redukuja.**
Uzytkownik, ktory placi za pakiet i ogada 2h/miesiac, zrezygnuje. Uzytkownik, ktory co tydzien odkrywa cos swietnego — zostaje. To jest mierzalne i bezposrednio wplywa na LTV.

**3. Z rury w kuratora — strategiczna zmiana pozycji.**
Dzis T-Mobile jest warstwa rozliczeniowa dla streamingu. TasteRay zamienia go w inteligentna warstwe kuratorska. To przesuniecie od dostawcy infrastruktury do dostawcy doswiadczenia — defensowalna pozycja, ktorej platformy nie moga obejsc.

**4. Rozumienie motywacji, nie tylko sledzenie klikniec.**
Algorytmy platform robia "ludzie, ktorzy obejrzeli X, obejrzeli tez Y". TasteRay rozumie *dlaczego* komus cos sie podobalo — wartosci, nastroj, tematy narracyjne. To umozliwia prawdziwe odkrywanie, a nie powtarzanie wzorcow.

**5. Profil psychologiczny to strategiczny asset T-Mobile, nie platform.**
Zrozumienie, ktore buduje TasteRay, nalezy do T-Mobile. Im dluzej uzytkownik korzysta, tym lepsze rekomendacje, tym trudniej mu odejsc. Klasyczny flywheel — ale wlasnosc danych jest po stronie operatora.

---

## Struktura Spotkania (10 min)

| Czas | Kto | Co |
|------|-----|----|
| 0:00–1:00 | **CEO** | Problem statement — "Wasze dane pokazuja, ze uzytkownicy nie korzystaja. Algorytmy platform tego nie rozwiaza, bo kazdy widzi tylko swoj kawalek." |
| 1:00–3:00 | **CEO** | Wizja — T-Mobile jako cross-platformowy kurator gustu. Argumenty 1, 3 i 5. Zero technologii — tylko pozycjonowanie strategiczne. |
| 3:00–5:00 | **CEO** | Live demo — scenariusz returning user (patrz nizej). To jest "wow moment". |
| 5:00–7:00 | **CTO** | Bezpieczenstwo i compliance — GDPR/DSGVO (to Niemcy, to priorytet nr 1), data residency, anonimizacja profili, zarzadzanie zgodami. Architektura integracji — REST API, <3s latency, 99.9% uptime SLA. Skala — jak wyglada onboarding milionow uzytkownikow DT. |
| 7:00–9:00 | **CTO** | Modele wdrozenia — (a) widget/mikroserwis w aplikacji T-Mobile TV, (b) push notifications z rekomendacjami, (c) integracja z EPG/TV guide. Roadmap techniczny — co jest gotowe dzis, co wymaga konfiguracji, milestones do pilota. |
| 9:00–10:00 | **CEO** | Zamkniecie z propozycja pilota — "Dajcie nam 10 000 uzytkownikow na 3 miesiace. Mierzymy zaangazowanie, churn rate, NPS. Zero ryzyka, mierzalny wynik." |

---

## Demo: Returning User

Jedyne demo do pokazania. To jest cross-platformowy moment, ktorego zadna platforma nie jest w stanie dostarczyc samodzielnie.

**Setup:** Uzytkownik, ktory juz ma profil TasteRay zbudowany z wczesniejszych rozmow. Profil chwyta cechy psychologiczne — nie tylko preferencje gatunkowe, ale *dlaczego* lubi to, co lubi (wartosci, tematy narracyjne, wzorce emocjonalne).

**Moment:** Uzytkownik mowi: "Nudzi mnie Netflix. Co powinienem obejrzec na Disney+?"

**Co robi TasteRay:**
1. Siega po istniejacy profil psychologiczny (nie tylko historie ogladania)
2. Dopasowuje do katalogu Disney+ na podstawie gleokiego zrozumienia
3. Zwraca rekomendacje z czytelnymi wyjasnieniami, ktore lacza sie z tym, co naprawde jest wazne dla tej konkretnej osoby

**Co podkreslic:**
- Rekomendacja przekracza granice platform — niemozliwe dla algorytmu jakiejkolwiek pojedynczej platformy
- Wyjasnienie brzmi jakby pochodzilo od kogos, kto cie *zna*, a nie od maszyny ("Bo reagujesz na historie o outsiderach, ktorzy znajduja przynaleznosc — i ten film ma dokladnie ten sam podprad")
- Profil staje sie bogatszy z kazda interakcja — flywheel w akcji

---

## CTO — Dodatkowe Tematy do Przygotowania

Poza bezpieczenstwem i skalowaniem, badz gotowy na:

- **Neutralnosc platformowa** — TasteRay nie faworyzuje zadnej platformy. Rekomendacje sa oparte na dopasowaniu do uzytkownika, nie na dealach biznesowych. Wazne: DT nie moze byc oskarzony o stronniczosc.
- **Przejrzystosc algorytmu** — W odróznieniu od black-boxowych rekomendacji platform, TasteRay zwraca "why match" — czytelne, ludzkie wyjasnienia. To jest explainable AI, co ma znaczenie w srodowisku regulacyjnym EU (AI Act).
- **Opcje deploymentu** — Chmura (szybki start) vs. on-premise/private cloud (dla wewnetrznych wymagan DT). Spodziewajcie sie tego pytania.

---

## Zamkniecie: Propozycja Pilota

10 000 uzytkownikow. 3 miesiace. Trzy metryki:
1. **Zaangazowanie** — godziny ogladania przed vs. po
2. **Churn rate** — wskaznik rezygnacji z pakietu w grupie testowej vs. kontrolnej
3. **NPS** — satysfakcja uzytkownikow z rekomendacji

Zero ryzyka. Mierzalny wynik. Jasne kryteria go/no-go.
