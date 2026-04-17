from typing import Iterator

import psycopg

from .config import settings


def get_connection() -> Iterator[psycopg.Connection]:
    with psycopg.connect(settings.database_url) as conn:
        yield conn
