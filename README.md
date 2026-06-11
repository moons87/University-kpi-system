# University Analytics Platform

Полнофункциональная аналитическая платформа для управления данными кафедры университета. Система собирает, хранит, обрабатывает и визуализирует показатели преподавателей, рассчитывает KPI и предоставляет удобный интерфейс для разных ролей пользователей.

---

## Возможности

### Для администраторов
- Полное управление данными кафедры: преподаватели, кафедры, должности, учёные степени
- Настройка весов и максимальных значений для расчёта KPI
- Управление учебными периодами (семестрами)
- Управление предметами и группами студентов
- Просмотр отчётов и выгрузка данных

### Для эдвайзеров
- Создание и управление академическими группами
- Добавление студентов в группы с полным набором данных:
  - Уровень обучения (бакалавриат, магистратура, докторантура)
  - Год поступления и откуда студент
  - Язык и форма обучения (грант / платник)
  - Пол
  - Оценки по предметам

### Для преподавателей
- Просмотр личного KPI и своих данных
- Доступ к информации о публикациях, проектах, патентах и достижениях

### Аналитика и KPI
- Автоматический расчёт KPI по четырём категориям:
  - Учебная нагрузка (30%)
  - Публикации Scopus/WoS (35%)
  - Научные проекты (15%)
  - Достижения и награды (20%)
- Настраиваемые веса — администратор может изменить формулу в любой момент
- Гистограмма KPI по всем преподавателям на главной странице

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 18, MUI v7, Recharts / MUI X Charts |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| База данных | PostgreSQL |
| Аутентификация | JWT Bearer (python-jose + passlib) |
| ETL | Pandas + SQLAlchemy |
| BI | Power BI (прямое подключение к PostgreSQL + CSV-экспорт) |

---

## Роли пользователей

| Роль | Доступ |
|------|--------|
| `admin` | Полный доступ ко всем разделам и настройкам |
| `advisor` | Управление группами и студентами |
| `teacher` | Просмотр собственных данных и KPI |

---

## Быстрый старт

### 1. База данных
```bash
psql -U postgres -c "CREATE DATABASE university_analytics;"
psql -U postgres -d university_analytics -f database/schema.sql
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Документация API доступна по адресу: `http://localhost:8000/docs`

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

Приложение откроется на: `http://localhost:3000`

### 4. Тестовые пользователи
```bash
cd backend
# Создать тестового преподавателя
python create_test_teacher.py

# Создать тестового эдвайзера
python create_test_advisor.py
```

| Email | Пароль | Роль |
|-------|--------|------|
| `admin@university.edu` | `admin123` | admin |
| `advisor@university.edu` | `advisor123` | advisor |
| `teacher@university.edu` | `password123` | teacher |

---

## Структура проекта

```
university-analytics/
├── backend/
│   ├── main.py              — FastAPI точка входа
│   ├── database.py          — SQLAlchemy engine + сессия
│   ├── models/              — ORM-модели (Teacher, Student, Group, ...)
│   ├── routers/             — API-маршруты
│   ├── schemas/             — Pydantic схемы запросов/ответов
│   ├── services/
│   │   └── kpi_engine.py    — Бизнес-логика расчёта KPI
│   └── auth/
│       └── jwt.py           — JWT аутентификация
├── frontend/
│   └── src/
│       ├── pages/           — Страницы приложения
│       ├── components/      — Переиспользуемые компоненты
│       ├── api/             — Axios-клиенты
│       └── store/           — Zustand state management
├── database/
│   ├── schema.sql           — DDL схема базы данных
│   └── seed.sql             — Тестовые данные
└── etl/
    └── pipeline.py          — ETL-оркестратор (Pandas)
```

---

## Переменные окружения

Создайте файл `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/university_analytics
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## Разделы приложения

| Раздел | Путь | Описание |
|--------|------|----------|
| Dashboard | `/` | Общая статистика и график KPI |
| Преподаватели | `/teachers` | Список и профили преподавателей |
| Студенты | `/students` | Управление студентами (эдвайзер / admin) |
| Нагрузка | `/teaching-load` | Учебная нагрузка по семестрам |
| Публикации | `/publications` | Научные публикации (Scopus, WoS, локальные) |
| Патенты | `/patents` | Патенты и изобретения |
| Достижения | `/achievements` | Награды и достижения |
| Проекты | `/projects` | Научные и грантовые проекты |
| KPI | `/kpi` | Расчёт и визуализация KPI |
| Отчёты | `/reports` | Выгрузка данных (admin) |
| Настройки | `/settings` | Конфигурация весов, предметов, групп, периодов |
