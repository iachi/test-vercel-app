import psycopg
from psycopg.rows import dict_row

from ..models.contact import ContactIn, ContactOut


def insert_contact(conn: psycopg.Connection, data: ContactIn) -> ContactOut:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into public.contacts (name, phone)
            values (%s, %s)
            returning id, name, phone, created_at
            """,
            (data.name, data.phone),
        )
        row = cur.fetchone()
    assert row is not None
    return ContactOut(**row)
