# PSR Campus System Architecture

## 1. System Architecture Diagram
This diagram outlines the flow between the different layers of the PSR Campus System.

```mermaid
graph TD
    subgraph Hardware Layer
        ESP[ESP32 Microcontroller]
        ESP -->|SPI| RFID[RC522 RFID Reader]
        ESP -->|GPIO| Ultra[Ultrasonic Sensor HC-SR04]
        ESP -->|GPIO| Buzz[Buzzer & LEDs]
        ESP -->|I2C| LCD[LCD 16x2]
    end

    subgraph User Layer
        Web[Next.js Web Client]
        Cam[Browser Camera / face-api.js]
    end

    subgraph Network & Cloud Layer
        NextAPI[Next.js API Routes]
        Firebase[(Firebase Cloud Firestore)]
        Twilio[Twilio WhatsApp Notification API]
    end

    %% Connections
    ESP -- HTTP POST /api/entry --> NextAPI
    ESP -- HTTP POST /api/attendance/rfid --> NextAPI
    Web -- HTTP --> NextAPI
    Cam -- extracting 128D embedding --> Web
    NextAPI -- CRUD Operations --> Firebase
    NextAPI -- "Trigger Message" --> Twilio
```

## 2. Entity Relationship (ER) Diagram
This diagram shows the main data structures stored in the NoSQL Firebase store.

```mermaid
erDiagram
    USERS {
        string id PK
        string role "student | teacher | admin"
        string name
        string email
        string password_hash
        string department
        string phone
        boolean approved
        array face_embedding "length 128"
        boolean face_registered
    }

    LECTURES {
        string id PK
        string teacher_id FK
        string subject
        string classroom
        timestamp start_time
        timestamp end_time
        string status "scheduled | active | completed"
    }

    ATTENDANCE {
        string id PK
        string student_id FK
        string lecture_id FK
        timestamp time
        string method "RFID | Face | Manual"
        string status "Present | Late"
        string verified_by "system | teacher_id"
    }

    CAMPUS_ENTRIES {
        string id PK
        string hardware_reported
        string gate
        string method
        string rfid_scanned
        timestamp timestamp
    }

    USERS ||--o{ LECTURES : "Teacher schedules"
    USERS ||--o{ ATTENDANCE : "Student records"
    LECTURES ||--o{ ATTENDANCE : "has"
```

## 3. Circuit and Wiring Table
Included in `/esp32_firmware/smart_campus.ino` header comment.
- **RFID**: SPI (SDA=5, SCK=18, MOSI=23, MISO=19, RST=22)
- **Ultrasonic**: TRIG=12, ECHO=14
- **Buzzer**: 27
- **LCD**: I2C (SDA=21, SCL=22)
