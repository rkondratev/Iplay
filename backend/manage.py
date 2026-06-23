import argparse
import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Video

def add_video(title: str, url: str, channel: str = None):
    db = SessionLocal()
    try:
        video = Video(title=title, video_url=url, channel_name=channel, views=0)
        db.add(video)
        db.commit()
        db.refresh(video)
        print(f"Видео добавлено (ID: {video.id})")
        print(f"   Название: {video.title}")
        print(f"   URL: {video.video_url}")
        if channel:
            print(f"   Канал: {video.channel_name}")
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        db.close()

def delete_video(video_id: int):
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            print(f"Видео с ID {video_id} не найдено")
            return
        
        title = video.title
        db.delete(video)
        db.commit()
        print(f"Видео удалено: {title}")
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        db.close()

def search_videos(query: str):
    db = SessionLocal()
    try:
        videos = db.query(Video).filter(
            Video.title.ilike(f"%{query}%")
        ).all()
        
        if not videos:
            print(f"По запросу '{query}' ничего не найдено")
            return
        
        print(f"Найдено видео по запросу '{query}': {len(videos)}\n")
        print(f"{'ID':<5} {'Название':<40} {'Просмотры':<12} {'Канал':<20}")
        print("-" * 80)
        for v in videos:
            channel = v.channel_name or "-"
            print(f"{v.id:<5} {v.title:<40} {v.views:<12} {channel:<20}")
        
        print(f"\nЧтобы удалить видео, используйте:")
        print(f"   python manage.py delete --id <ID>")
    finally:
        db.close()

def list_videos():
    db = SessionLocal()
    try:
        videos = db.query(Video).all()
        if not videos:
            print("База данных пуста")
            return
        
        print(f"Все видео ({len(videos)}):\n")
        print(f"{'ID':<5} {'Название':<40} {'Просмотры':<12} {'Канал':<20}")
        print("-" * 80)
        for v in videos:
            channel = v.channel_name or "-"
            print(f"{v.id:<5} {v.title:<40} {v.views:<12} {channel:<20}")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Управление видео в IfBest")
    subparsers = parser.add_subparsers(dest="command", help="Доступные команды")
    
    add_parser = subparsers.add_parser("add", help="Добавить видео")
    add_parser.add_argument("--title", required=True, help="Название видео")
    add_parser.add_argument("--url", required=True, help="Ссылка на m3u8")
    add_parser.add_argument("--channel", help="Название канала")
    
    delete_parser = subparsers.add_parser("delete", help="Удалить видео по ID")
    delete_parser.add_argument("--id", required=True, type=int, help="ID видео")
    
    search_parser = subparsers.add_parser("search", help="Найти видео по названию")
    search_parser.add_argument("--query", required=True, help="Поисковый запрос")
    
    subparsers.add_parser("list", help="Показать все видео")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == "add":
        add_video(args.title, args.url, args.channel)
    elif args.command == "delete":
        delete_video(args.id)
    elif args.command == "search":
        search_videos(args.query)
    elif args.command == "list":
        list_videos()

if __name__ == "__main__":
    main()
