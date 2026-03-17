user_schema = {
    "type": "object",
    "required": ["id", "type", "name", "email"],
    "properties": {
        "id": {"type": "string", "minLength": 10},
        "type": {"type": "string", "enum": ["USER"]},
        "name": {"type": "string", "minLength": 1},
        "email": {"type": "string", "pattern": ".+@.+"},
    },
    "additionalProperties": True
}

group_schema = {
    "type": "object",
    "required": ["id", "type", "name"],
    "properties": {
        "id": {"type": "string", "minLength": 10},
        "type": {"type": "string", "enum": ["GROUP"]},
        "name": {"type": "string", "minLength": 1},
    },
    "additionalProperties": True
}

org_item_schema = {
    "type": "object",
    "required": ["id", "name", "depth"],
    "properties": {
        "id": {"type": "string", "minLength": 10},
        "name": {"type": "string"},
        "depth": {"type": "integer", "minimum": 1},
    },
    "additionalProperties": True
}

list_of_orgs_schema = {
    "type": "array",
    "items": org_item_schema
}

node_list_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "required": ["id", "name", "depth"],
        "properties": {
            "id": {"type": "string", "minLength": 10},
            "name": {"type": "string"},
            "depth": {"type": "integer", "minimum": 1}
        },
        "additionalProperties": True
    }
}

error_schema = {
    "type": "object",
    "required": ["message"],
    "properties": {
        "message": {"type": "string"}
    },
    "additionalProperties": True
}
