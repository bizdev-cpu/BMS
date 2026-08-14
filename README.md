# BMS

Google Sheets와 Google Apps Script 기반으로 운영되던 기존 BMS(Business Management System)를 개선하기 위한 프로젝트입니다.

기존 시스템의 데이터 구조와 업무 로직은 유지하면서, 프론트엔드를 React + Vite 기반으로 분리하여 유지보수성과 확장성을 높이는 것을 목표로 합니다.

## 주요 기능

* 사업 정보 조회
* 사업별 인력 투입 현황 관리
* 월별 투입률 계산 및 조회
* 예정 / 진행 / 종료 상태별 데이터 관리
* KDT 변경 내역 조회
* KDT Snapshot 생성
* Google Sheets 기반 데이터 조회 및 수정
* Apps Script Web App API 연동

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend / Data

* Google Apps Script
* Google Sheets
* Apps Script Web App API

## Architecture

```text
React + Vite
     |
     | HTTP Request
     v
Google Apps Script Web App
     |
     v
Google Sheets
```

프론트엔드에서는 Apps Script로 배포된 Web App API를 호출하고, Apps Script가 Google Sheets의 데이터를 조회하거나 수정합니다.

## Project Structure

```text
src/
├── api/
│   └── bmsApi.js
├── components/
├── pages/
├── utils/
├── constants/
├── assets/
├── App.jsx
└── main.jsx
```

### `api`

Google Apps Script API와 통신하는 로직을 관리합니다.

예시:

```javascript
readAllData();
readKdtChangeReport();
createKdtSnapshot();
executeBmsAction();
```

### `components`

여러 화면에서 재사용하는 UI 컴포넌트를 관리합니다.

### `pages`

BMS의 각 화면 단위 컴포넌트를 관리합니다.

### `utils`

월별 투입률 계산, 날짜 처리 등 화면과 독립적인 공통 로직을 관리합니다.

### `constants`

시트 이름, 상태값, 설정값 등 프로젝트 전반에서 사용하는 상수를 관리합니다.

## Environment Variables

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_BMS_API_URL=YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

`VITE_BMS_API_URL`에는 Google Apps Script Web App 배포 URL을 입력합니다.

환경변수가 설정되어 있지 않은 경우 다음 오류가 발생할 수 있습니다.

```text
VITE_BMS_API_URL이 없습니다. .env 파일을 확인하세요.
```

> `.env` 파일에는 배포 URL 등 외부에 공개하지 않을 값을 포함할 수 있으므로 Git에 커밋하지 않습니다.

## Installation

Repository를 clone합니다.

```bash
git clone <repository-url>
```

프로젝트 디렉터리로 이동합니다.

```bash
cd <project-name>
```

패키지를 설치합니다.

```bash
npm install
```

`.env` 파일을 생성하고 Apps Script API URL을 설정합니다.

```env
VITE_BMS_API_URL=YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

개발 서버를 실행합니다.

```bash
npm run dev
```

## API

### 전체 데이터 조회

```javascript
readAllData();
```

Apps Script의 다음 API를 호출합니다.

```text
GET ?action=readAll
```

### BMS Action 실행

```javascript
executeBmsAction(action, payload);
```

POST 요청을 통해 Apps Script의 특정 action을 실행합니다.

```javascript
{
  action,
  payload
}
```

### KDT 변경 내역 조회

```javascript
readKdtChangeReport();
```

```text
GET ?action=readKdtChangeReport
```

### KDT Snapshot 생성

```javascript
createKdtSnapshot();
```

내부적으로 다음 action을 실행합니다.

```text
kdtSnapshot
```

## Response Format

Apps Script API는 기본적으로 다음 형태의 응답을 사용합니다.

```json
{
  "status": "success",
  "data": {}
}
```

요청에 실패한 경우:

```json
{
  "status": "error",
  "message": "에러 메시지"
}
```

프론트엔드의 `parseResponse()`에서 HTTP 상태와 API 응답 상태를 공통으로 검사합니다.

## Business Logic

BMS에서는 인력의 사업 투입 기간과 투입률을 기준으로 월별 데이터를 계산합니다.

예를 들어 각 assignment에는 다음과 같은 정보가 포함될 수 있습니다.

```text
사업
시작일
종료일
투입률
상태
```

시작일과 종료일 사이의 월을 계산한 뒤 각 월의 투입률을 Matrix 형태로 구성합니다.

종료된 assignment는 계산에서 제외하며, 예정 상태의 데이터를 포함할지는 옵션에 따라 결정할 수 있습니다.

## Google Sheets

Google Sheets를 실제 데이터 저장소로 사용합니다.

Apps Script에서 시트 데이터를 읽고 가공한 뒤 프론트엔드에 전달하며, 프론트엔드에서 직접 Google Sheets API를 호출하지 않습니다.

이를 통해 다음과 같이 역할을 분리합니다.

```text
React
→ UI / 사용자 인터랙션

Apps Script
→ API / 비즈니스 로직 / Sheet 접근

Google Sheets
→ 데이터 저장
```

## Refactoring Goals

기존 BMS는 HTML, UI 로직, 데이터 처리 로직이 하나의 Apps Script 프로젝트에 결합되어 있어 기능 변경 시 영향 범위를 파악하기 어려운 구조였습니다.

Renewal 프로젝트에서는 다음을 목표로 리팩토링을 진행합니다.

* UI와 데이터 처리 로직 분리
* React 컴포넌트 기반 화면 구성
* Apps Script API 역할 명확화
* 공통 로직 `utils` 분리
* API 호출 로직 중앙화
* 중복 코드 제거
* 유지보수 가능한 폴더 구조 구성
* 신규 기능 추가가 쉬운 구조로 개선

## Security

BMS는 사내 업무 데이터를 다루는 시스템이므로 사용자 접근 권한 관리가 필요합니다.

현재 Google Sheets 및 Apps Script 권한을 기반으로 한 접근 제어 구조를 검토하고 있습니다.

프론트엔드의 환경변수나 URL 자체를 보안 수단으로 사용해서는 안 되며, 최종적인 데이터 접근 권한은 Apps Script 또는 데이터 계층에서 검증해야 합니다.

## Development Status

현재 기존 BMS 기능을 React + Vite 환경으로 이전하면서 구조 개선을 진행하고 있습니다.

주요 작업:

* [x] React + Vite 프로젝트 구성
* [x] Apps Script Web App API 연동
* [x] 환경변수를 통한 API URL 관리
* [x] 공통 API 요청 함수 구성
* [x] 전체 데이터 조회
* [x] KDT 변경 내역 조회
* [x] KDT Snapshot API 연동
* [ ] 기존 화면 컴포넌트 분리
* [ ] 공통 유틸 함수 분리
* [ ] 상태 관리 구조 정리
* [ ] 사용자 인증 및 권한 구조 개선
* [ ] API 및 에러 처리 구조 개선
* [ ] 전체 기능 QA

## Notes

이 프로젝트는 실제 사내 업무에서 지속적으로 사용하는 BMS의 유지보수성과 사용성을 개선하기 위해 진행하는 Renewal 프로젝트입니다.

기존 업무 프로세스와 Google Sheets 기반 데이터 운영 방식은 최대한 유지하면서, 프론트엔드와 데이터 처리 영역의 책임을 분리하는 방향으로 개선하고 있습니다.
