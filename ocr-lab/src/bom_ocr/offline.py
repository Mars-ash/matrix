"""Defense in depth for single-process local inference, not an OS firewall."""

import socket
from contextlib import contextmanager
from unittest.mock import patch


def _deny_network(*args, **kwargs):
    raise OSError("Network access is disabled during local OCR.")


@contextmanager
def network_disabled():
    """Block Python socket I/O, including native libraries using Python sockets.

    The private release benchmark additionally requires an OS-level no-egress
    boundary; native libraries could create sockets without Python's API.
    """
    with (
        patch.object(socket.socket, "connect", _deny_network),
        patch.object(socket.socket, "connect_ex", _deny_network),
        patch.object(socket.socket, "sendto", _deny_network),
        patch.object(socket, "create_connection", _deny_network),
        patch.object(socket, "getaddrinfo", _deny_network),
    ):
        yield
