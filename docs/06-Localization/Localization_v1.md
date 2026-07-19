## MODULE 06: Localization Management

### 1. Executive Summary
The Localization Management module enables ABSHealthcareLite to operate in multiple languages and regions. It provides the infrastructure to manage UI text, labels, error messages, and cultural formats (date, currency, number) for English, Bangla, Arabic, Urdu, and Hindi. It supports both Left-to-Right (LTR) and Right-to-Left (RTL) layouts, ensuring a native experience for diverse users.

### 2. Business Purpose
To expand the platform's reach to non-English speaking markets and improve usability for local staff and patients. Localization is not just about translation; it's about respecting regional formats and layouts, which is essential for accuracy in healthcare documentation and financial reporting.

### 3. Actors
*   **Host Admin**: Manages the master list of languages and global translations.
*   **Translator**: Specialized role for entering and verifying translations in the system.
*   **End User**: Selects their preferred language and regional settings.

### 4. Functional Requirements
*   **Language Management**: Enable/disable specific languages (English, Bangla, Arabic, Urdu, Hindi).
*   **Translation Registry**: A centralized database of all UI strings (Keys) and their translations (Values).
*   **RTL/LTR Support**: Automatically flip the UI layout based on the selected language's direction.
*   **Cultural Formatting**: Manage regional formats for Dates (DD/MM/YYYY vs MM/DD/YYYY), Currency, and Numbers.
*   **Dynamic Loading**: Load translations without requiring a system restart.
*   **Missing Translation Tracking**: Identify and report UI keys that lack translations for specific languages.
*   **Export/Import**: Support for `.resx`, JSON, or Excel formats for external translation services.

### 5. Non-Functional Requirements
*   **Performance**: Localization lookups must be cached in-memory to avoid database hits on every page render.
*   **Unicode Support**: Full UTF-8/UTF-16 support for complex scripts (Bangla, Arabic).
*   **Maintainability**: Use a "Key-Based" approach (e.g., `LBL_SAVE_BUTTON`) rather than hardcoding default English text.
*   **Fallback**: If a translation is missing, fall back to the default language (English).

### 6. Screen List
1.  **Language Settings**: Manage active languages and directions.
2.  **Translation Manager**: Search and edit translations for all UI keys.
3.  **Format Configuration**: Define date, time, and currency formats per language.
4.  **Localization Audit**: Track changes to translations.

### 7. ASCII Mockups

**Translation Manager**
```
--------------------------------------------------------------------------------
Localization > Translation Manager
--------------------------------------------------------------------------------
Search Key/Text: [ Save... ]  Language: [ Arabic v ]  Status: [ All v ]

| Key                | English (Default) | Arabic (Translation) | Action |
|--------------------|-------------------|----------------------|--------|
| LBL_SAVE           | Save              | حفظ                  | [Edit] |
| LBL_CANCEL         | Cancel            | إلغاء                | [Edit] |
| MSG_LOGIN_SUCCESS  | Login Successful  | تم تسجيل الدخول بنجاح | [Edit] |
| LBL_PATIENT_NAME   | Patient Name      | اسم المريض           | [Edit] |

[ Save All Changes ] [ Import Excel ] [ Export Missing ]
--------------------------------------------------------------------------------
```

**Language Settings**
```
--------------------------------------------------------------------------------
Localization > Language Settings
--------------------------------------------------------------------------------
| Language | Code | Direction | Status   | Default | Action       |
|----------|------|-----------|----------|---------|--------------|
| English  | en   | LTR       | Active   | [x]     | [Edit]       |
| Bangla   | bn   | LTR       | Active   | [ ]     | [Edit]       |
| Arabic   | ar   | RTL       | Active   | [ ]     | [Edit]       |
| Urdu     | ur   | RTL       | Inactive | [ ]     | [Activate]   |

[ Add New Language ]
--------------------------------------------------------------------------------
```

### 8. Workflow
1.  **Add Key**: A developer adds a new UI element with a key `LBL_ADMIT_DATE`.
2.  **Translate**: The Translator enters the Bangla and Arabic values in the Translation Manager.
3.  **User Selects**: A user switches their profile language to Arabic.
4.  **Render**: The system detects `RTL` direction, flips the CSS, and replaces all keys with their Arabic values.

### 9. Business Rules
*   **Global Scope**: Translations are generally global (shared across tenants) to ensure consistency.
*   **Tenant Overrides**: (Optional) Allow specific tenants to override certain labels (e.g., "Client" instead of "Patient").
*   **RTL Logic**: When a language is RTL (Arabic, Urdu), the sidebar, navigation, and form alignment must mirror.
*   **UTF-8**: All database columns for text must use `NVARCHAR` to support multi-byte characters.

### 10. Database Design

**Table: AI_Language**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LanguageID | INT (Identity) | Yes | Primary Key |
| LanguageName | NVARCHAR(50) | Yes | e.g., Arabic |
| CultureCode | NVARCHAR(10) | Yes | e.g., ar-SA |
| Direction | NVARCHAR(3) | Yes | LTR or RTL |
| IsActive | BIT | Yes | Toggle availability |
| IsDefault | BIT | Yes | System fallback language |

**Table: AI_Translation**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TranslationID | BIGINT (Identity)| Yes | Primary Key |
| LanguageID | INT | Yes | FK to AI_Language |
| ResourceKey | NVARCHAR(200) | Yes | e.g., LBL_PATIENT_NAME |
| ResourceValue | NVARCHAR(MAX) | Yes | The translated text |
| ModuleName | NVARCHAR(50) | No | For grouping |

### 11. Security Design
*   **Input Validation**: Prevent script injection in translation fields.
*   **Access Control**: Only "Translators" or "Host Admins" can modify the master translation registry.

### 12. Audit Design
*   **Audit Trail**: Log who changed a translation and when, especially for critical clinical terms.

### 13. API Ready Design
*   **Endpoints**: `/api/v1/localization/resources?lang=ar`, `/api/v1/localization/languages`.
*   **Client-Side Caching**: Mobile and Web apps should cache the resource JSON to reduce traffic.

### 14. Mobile Ready Design
*   **Dynamic Strings**: Mobile app fetches the latest translation JSON on startup or via background sync.
*   **Layout Mirroring**: Mobile UI frameworks must support RTL mirroring based on the `Direction` flag.

### 15. Localization Requirements
*   **Supported Languages**: English, Bangla, Arabic, Urdu, Hindi.
*   **RTL Support**: Mandatory for Arabic and Urdu.
*   **Date/Time**: Support for Hijri calendar (future expansion).

### 16. Future Expansion Plan
*   **AI Translation**: Integration with Google Translate or Azure Cognitive Services for initial drafts.
*   **Voice Localization**: Support for localized voice prompts in the mobile app.

### 17. Acceptance Criteria
*   **Language Switch**: Selecting "Arabic" immediately changes the UI text and flips the layout to RTL.
*   **Completeness**: All labels on a sample screen (e.g., Patient Registration) are translated.
*   **Formatting**: Dates and currencies appear in the correct regional format.
*   **Persistence**: User's language preference is saved and remembered for the next session.
