import os
import sys
import subprocess
import platform
import argparse

DB_NAME = "ifbest_db"
DB_USER = "ifbest"
DB_PASS = "ifbest123"

def run_cmd(cmd, shell=True):
    try:
        subprocess.run(cmd, shell=shell, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Ошибка: {e}")
        return False

def setup_linux():
    print("Настройка для Linux...")
    
    if not run_cmd("command -v psql"):
        print("Установка PostgreSQL...")
        run_cmd("sudo apt-get install -y postgresql postgresql-contrib")
    
    run_cmd("sudo systemctl enable --now postgresql")
    
    run_cmd(f'sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = \'{DB_NAME}\'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE {DB_NAME};"')
    
    run_cmd(f'sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = \'{DB_USER}\'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER {DB_USER} WITH PASSWORD \'{DB_PASS}\';"')
    
    run_cmd(f"sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};\"")
    run_cmd(f"sudo -u postgres psql -d {DB_NAME} -c \"GRANT ALL ON SCHEMA public TO {DB_USER};\"")
    
    with open(".env", "w") as f:
        f.write(f"DATABASE_URL=postgresql://{DB_USER}:{DB_PASS}@localhost:5432/{DB_NAME}\n")
    
    print("Готово!")

def setup_macos():
    print("Настройка для macOS...")
    
    if not run_cmd("command -v psql"):
        print("Установка PostgreSQL через Homebrew...")
        if not run_cmd("command -v brew"):
            print("Homebrew не установлен. Установите его: https://brew.sh")
            return False
        run_cmd("brew install postgresql")
        run_cmd("brew services start postgresql")
    
    run_cmd(f'psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = \'{DB_NAME}\'" | grep -q 1 || createdb {DB_NAME}')
    
    run_cmd(f'psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = \'{DB_USER}\'" | grep -q 1 || createuser {DB_USER}')
    
    run_cmd(f"psql postgres -c \"ALTER USER {DB_USER} WITH PASSWORD '{DB_PASS}';\"")
    run_cmd(f"psql postgres -c \"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};\"")
    run_cmd(f"psql -d {DB_NAME} -c \"GRANT ALL ON SCHEMA public TO {DB_USER};\"")
    
    with open(".env", "w") as f:
        f.write(f"DATABASE_URL=postgresql://{DB_USER}:{DB_PASS}@localhost:5432/{DB_NAME}\n")
    
    print("Готово!")

def setup_windows():
    print("Настройка для Windows...")
    print("PostgreSQL должен быть установлен вручную.")
    print("Скачайте установщик: https://www.postgresql.org/download/windows/")
    print("После установки запустите:")
    print(f'  psql -U postgres -c "CREATE DATABASE {DB_NAME};"')
    print(f'  psql -U postgres -c "CREATE USER {DB_USER} WITH PASSWORD \'{DB_PASS}\';"')
    print(f'  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};"')
    print(f'  psql -U postgres -d {DB_NAME} -c "GRANT ALL ON SCHEMA public TO {DB_USER};"')
    
    with open(".env", "w") as f:
        f.write(f"DATABASE_URL=postgresql://{DB_USER}:{DB_PASS}@localhost:5432/{DB_NAME}\n")
    
    print("Файл .env создан. Завершите настройку вручную.")

def drop_database(system):
    print(f"Удаление базы данных '{DB_NAME}' и пользователя '{DB_USER}'...")
    
    if system == "Linux":
        run_cmd(f'sudo -u postgres psql -c "DROP DATABASE IF EXISTS {DB_NAME};"')
        run_cmd(f'sudo -u postgres psql -c "DROP ROLE IF EXISTS {DB_USER};"')
    elif system == "Darwin":
        run_cmd(f'dropdb -U postgres --if-exists {DB_NAME}')
        run_cmd(f'dropuser -U postgres --if-exists {DB_USER}')
    elif system == "Windows":
        run_cmd(f'psql -U postgres -c "DROP DATABASE IF EXISTS {DB_NAME};"')
        run_cmd(f'psql -U postgres -c "DROP ROLE IF EXISTS {DB_USER};"')
        
    if os.path.exists(".env"):
        os.remove(".env")
        print("Файл .env удален.")
        
    print("База данных и пользователь успешно удалены.")

def print_info(system):
    print("\n" + "=" * 60)
    print("ИНФОРМАЦИЯ О БАЗЕ ДАННЫХ")
    print("=" * 60)
    print(f"Имя базы данных: {DB_NAME}")
    print(f"Пользователь:    {DB_USER}")
    print(f"Пароль:          {DB_PASS}")
    print(f"Хост:            localhost")
    print(f"Порт:            5432")
    print("=" * 60)
    
    print("\nКОМАНДЫ ДЛЯ РАБОТЫ С БД:")
    print("-" * 60)
    
    if system == "Linux":
        print(f"Подключение:     psql -U {DB_USER} -d {DB_NAME} -h localhost")
        print(f"Удаление БД:     sudo -u postgres psql -c \"DROP DATABASE IF EXISTS {DB_NAME};\"")
        print(f"Удаление юзера:  sudo -u postgres psql -c \"DROP ROLE IF EXISTS {DB_USER};\"")
    elif system == "Darwin":
        print(f"Подключение:     psql -U {DB_USER} -d {DB_NAME} -h localhost")
        print(f"Удаление БД:     dropdb {DB_NAME}")
        print(f"Удаление юзера:  dropuser {DB_USER}")
    elif system == "Windows":
        print(f"Подключение:     psql -U {DB_USER} -d {DB_NAME} -h localhost")
        print(f"Удаление БД:     psql -U postgres -c \"DROP DATABASE IF EXISTS {DB_NAME};\"")
        print(f"Удаление юзера:  psql -U postgres -c \"DROP ROLE IF EXISTS {DB_USER};\"")
    
    print("-" * 60)
    print("Просмотр данных:   python manage.py list")
    print("Поиск видео:       python manage.py search --query \"слово\"")
    print("Добавить видео:    python manage.py add --title \"...\" --url \"...\"")
    print("Удалить видео:     python manage.py delete --id <ID>")
    print("=" * 60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Установка и управление БД для IfBest")
    parser.add_argument("--drop", action="store_true", help="Удалить базу данных и пользователя")
    args = parser.parse_args()

    system = platform.system()

    if args.drop:
        drop_database(system)
    else:
        if system == "Linux":
            setup_linux()
        elif system == "Darwin":
            setup_macos()
        elif system == "Windows":
            setup_windows()
        else:
            print(f"Неподдерживаемая ОС: {system}")
            sys.exit(1)
        
        print_info(system)

if __name__ == "__main__":
    main()
