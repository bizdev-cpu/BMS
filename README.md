# BMS

Google Sheets와 Google Apps Script 기반으로 운영되던 기존 BMS(Business Management System)를 개선하기 위한 프로젝트입니다.

기존 시스템의 데이터 구조와 업무 로직은 유지하면서, 프론트엔드를 React + Vite 기반으로 분리하여 유지보수성과 확장성을 높이는 것을 목표로 합니다.

주요 기능
사업 정보 조회
사업별 인력 투입 현황 관리
월별 투입률 계산 및 조회
예정 / 진행 / 종료 상태별 데이터 관리
KDT 변경 내역 조회
KDT Snapshot 생성
Google Sheets 기반 데이터 조회 및 수정
Apps Script Web App API 연동
Tech Stack
Frontend
React
Vite
JavaScript
CSS
Backend / Data
Google Apps Script
Google Sheets
Apps Script Web App API
Architecture
React + Vite
     |
     | HTTP Request
     v
Google Apps Script Web App
     |
     v
Google Sheets

프론트엔드에서는 Apps Script로 배포된 Web App API를 호출하고, Apps Script가 Google Sheets의 데이터를 조회하거나 수정합니다.
