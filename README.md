# Flight and Airport Management System

A web application for providing services to customers, namely airlines and passengers, Kyiv International Airport Zhulyany.

## Overview
Kyiv International Airport (Zhuliany) is a Spring Boot application designed to simplify airline operations, including flight creation, flight management, and providing bonuses to clients. For passengers, the application allows viewing available flights, tracking order history, booking, paying for, and canceling orders. They can also accumulate and redeem bonus points for flights. Additionally, the system provides the ability to view a real-time flight map. The system aims to make travel more convenient, transparent, and rewarding for passengers by offering real-time access to flight information and loyalty programs.

## Functionality

### Passenger
- View all active flights  
- Manage orders: view, pay for, and cancel bookings  
- Redeem accumulated bonus points  
- Manage personal information  

### Airline Staff
- Create flights (add, update, and delete flight information)  
- View their own flights  
- Provide bonuses to their clients  
- Manage personal information  

### Administrator
- View all flights (active and inactive)  
- Grant bonuses to clients  
- View and delete accounts of inactive clients  

## Technologies & Tools
- **Backend**: Spring Boot 3.x  
- **Frontend**: React  
- **Database**: PostgreSQL  
- **Architecture**: MVC (Model-View-Controller) Pattern  
- **ORM**: Spring Data JPA / Hibernate  
- **Authentication & Security**: Spring Security with Auth0 (JWT)  
- **Mapping**: MapStruct / Manual DTO mappers  
- **API**: RESTful endpoints  
- **Server**: Apache Tomcat  
- **Testing**: JUnit 5  
- **API Tools**: Postman  
- **Build Tool**: Maven

## Developers
- **Backend** - Antonov Andrii
- **Frontend** - Kovalenko Danylo
