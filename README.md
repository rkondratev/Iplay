# IfBest Video Player

*Видеохостинг с HLS-потоками, переключением качества и счётчиком просмотров*

---

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Технологии](#технологии)
- [Установка и запуск](#установка-и-запуск)
  - [Настройка базы данных](#настройка-базы-данных)
  - [Запуск бэкенда](#запуск-бэкенда)
  - [Запуск фронтенда](#запуск-фронтенда)
- [Управление видео](#управление-видео)
- [API ручки](#API-ручки)
- [Структура проекта](#структура-проекта)

---

## О проекте

IfBest Video Player — это веб-платформа для просмотра видео в формате HLS (m3u8), разработанная для видеохостинга IfBest. Проект состоит из бэкенда на FastAPI с базой данных PostgreSQL и фронтенда на чистом HTML/CSS/JavaScript с использованием библиотек HLS.js и Plyr.

Платформа поддерживает воспроизведение видео с несколькими уровнями качества, изменение скорости воспроизведения, счётчик просмотров и адаптивный дизайн.

---

## Возможности

- 🎬 **Воспроизведение HLS-потоков** — поддержка m3u8-манифестов с несколькими битрейтами
- 🎚️ **Переключение качества** — автоматическое определение доступных разрешений (360p, 480p, 720p, 1080p)
- ⏩ **Изменение скорости** — 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
- 👁️ **Счётчик просмотров** — автоматическое увеличение при первом нажатии Play
- 📱 **Адаптивный дизайн** — корректное отображение на десктопах, планшетах и мобильных устройствах
- 🎮 **Полный набор контролов** — Play/Pause, прогресс-бар, громкость, полноэкранный режим, PiP
- ⌨️ **Клавиатурные сокращения** — управление с клавиатуры (пробел, стрелки, F)
- 🔍 **Похожие видео** — блок с рекомендациями на странице просмотра
- 🗄️ **CLI-утилита** — управление видео через командную строку

---

## Структура

```sh
└── ifbest-video-player/
    ├── backend/
    │   ├── create_db.py        # Скрипт настройки БД (PostgreSQL)
    │   ├── crud.py             # CRUD-операции с БД
    │   ├── database.py         # Подключение к БД через SQLAlchemy
    │   ├── main.py             # FastAPI приложение, API endpoints
    │   ├── manage.py           # CLI для управления видео
    │   ├── models.py           # SQLAlchemy модели (Video)
    │   ├── requirements.txt    # Python-зависимости
    │   └── schemas.py          # Pydantic схемы для валидации
    └── frontend/
        ├── images/             # Изображения и favicon
        ├── index.html          # Главная страница (сетка видео)
        ├── video.html          # Страница просмотра видео
        ├── style.css           # Стили (тёмная тема)
        └── scripts/
            ├── setting_video.js  # Логика главной страницы
            └── video-page.js     # Логика страницы просмотра
```

---

## Установка и запуск

### Зависимости

- **Python** 3.8+
- **PostgreSQL** 12+
- **pip** (менеджер пакетов Python)

### Установка

1. **Клонируйте репозиторий:**

    ```sh
    git clone https://github.com/rkondratev/ifbest-video-player.git
    cd ifbest-video-player
    ```

2. **Создайте и активируйте виртуальное окружение:**

    ```sh
    python -m venv backend/.venv
    source backend/.venv/bin/activate        # Linux / macOS
    backend\.venv\Scripts\activate           # Windows
    ```

3. **Установите зависимости:**

    ```sh
    pip install -r backend/requirements.txt
    ```

### Настройка базы данных

1. **Запустите скрипт автоматической настройки БД:**

    ```sh
    cd backend
    python create_db.py
    ```

    Скрипт автоматически:
    - Установит PostgreSQL (если не установлен)
    - Создаст базу данных `ifbest_db`
    - Создаст пользователя `ifbest` с паролем `ifbest123`
    - Выдаст необходимые права
    - Создаст файл `.env` с настройками подключения

2. **Добавьте тестовые видео через CLI:**

    ```sh
    python manage.py add --title "Big Buck Bunny" --url "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" --channel "Mux Test"
    python manage.py add --title "Apple Test" --url "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8" --channel "Apple"
    ```

### Использование

Проект требует запуска **двух интерпретаторов питона** одновременно — бэкенда и фронтенда.

**Терминал 1 — Бэкенд:**

```sh
cd backend
source .venv/bin/activate
python main.py
```

Бэкенд запустится на `http://localhost:8000`. Swagger UI доступен по адресу `http://localhost:8000/docs`.

**Терминал 2 — Фронтенд:**

```sh
cd frontend
python -m http.server 8080
```

**Откройте сайт:**

Перейдите в браузере по адресу: **http://localhost:8080**

---

## API ручки

| Метод  | URL                          | Описание                          |
|--------|------------------------------|-----------------------------------|
| `GET ` | `/api/videos `               | Получить список всех видео        |
| `GET ` | `/api/video-info/{video_id}` | Получить информацию о видео по ID |
| `POST` | `/api/video/{video_id}/view` | Увеличить счётчик просмотров на 1 |
| `POST` | `/api/videos`                | Добавить новое видео              |

**Пример ответа `/api/video-info/1`:**

```json
{
  "id": 1,
  "title": "Big Buck Bunny",
  "views": 150,
  "channel": "Mux Test",
  "date": "2 ч. назад",
  "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
}
```

---

## Использование CLI

Утилита `manage.py` позволяет управлять видео из командной строки.

```sh
# Добавить видео
python manage.py add --title "Название" --url "https://example.com/video.m3u8" --channel "Канал"

# Показать все видео
python manage.py list

# Найти видео по названию
python manage.py search --query "слово"

# Удалить видео по ID
python manage.py delete --id 1

# Удалить базу данных
python create_db.py --drop
```

---


