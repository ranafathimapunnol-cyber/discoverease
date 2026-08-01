# 🌴 DiscoverEase - Kerala Tourism Management System

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![Qdrant](https://img.shields.io/badge/Qdrant-1.7-purple.svg)](https://qdrant.tech/)
[![Celery](https://img.shields.io/badge/Celery-5.3-brightgreen.svg)](https://docs.celeryq.dev/)

> **Discover the God's Own Country with Vector-Powered Recommendations**

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Role-Based Access Control](#role-based-access-control)
- [Vector Search Implementation](#vector-search-implementation)
- [Celery & Background Tasks](#celery--background-tasks)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**DiscoverEase** is a comprehensive tourism management platform for Kerala, India. It leverages vector search technology to provide personalized travel experiences, seamless booking management, and intelligent tour recommendations using PostgreSQL data converted to vector embeddings.

### Key Highlights
- 🔍 **Vector-Powered Search** using PostgreSQL data → Qdrant embeddings
- 👥 **4 Role-Based Authentication** with Google OAuth
- 📧 **Email-based Registration** with OTP verification
- ⏰ **Smart Trip Reminders** using Celery Beat
- 🗺️ **Vector Search** for tourism content
- 🎯 **Personalized Itinerary Generation** using vector similarity
- 🔐 **Google OAuth 2.0** for social login

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Google OAuth 2.0** integration for social login
- Session-based authentication with Django REST Framework
- Email-based registration with OTP verification
- 4 Role-Based Access Control (RBAC):
  - **Admin**: Full system control, user management, analytics
  - **Staff**: Content management, booking verification
  - **Guide**: Tour management, itinerary creation, availability
  - **Tourist**: Booking, reviews, personalized recommendations

### 🔍 Vector Search & Recommendations
- **PostgreSQL Data** converted to vector embeddings
- **Qdrant Vector Database** for efficient similarity search
- Semantic search across tourism content
- Smart destination recommendations based on vector similarity
- Personalized itinerary generation

### ⏰ Task Scheduling
- **Celery** for asynchronous task processing
- **Celery Beat** for periodic tasks:
  - Trip reminders (24hrs, 12hrs, 2hrs before trip)
  - Booking confirmation emails
  - Guide availability updates
  - Weekly analytics reports
  - clear expired tokens in every 30 mins

### 📱 Core Features
- Destination discovery with intelligent filtering
- Tour package management
- Real-time booking system
- User review and rating system
- Interactive Kerala tourism map
- local insights 
- Google authentication

---

## 🛠️ Tech Stack

### Backend
```yaml
Framework: Django 4.2 + Django REST Framework
Database: PostgreSQL 15 (with pgvector extension)
Cache & Message Broker: Redis 7.0
Task Queue: Celery 5.3 + Celery Beat
Authentication: Session-based + Google OAuth 2.0
Vector Database: Qdrant 1.7
Vector Generation: Sentence Transformers / Custom embeddings
Email: SMTP (Gmail/ SendGrid)