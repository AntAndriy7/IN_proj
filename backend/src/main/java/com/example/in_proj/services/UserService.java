package com.example.in_proj.services;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.AuthDTO;
import com.example.in_proj.dto.UserDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Flight;
import com.example.in_proj.entity.User;
import com.example.in_proj.mapper.UserMapper;
import com.example.in_proj.repository.BonusRepository;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.FlightRepository;
import com.example.in_proj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final FlightRepository flightRepository;
    private final BonusRepository bonusRepository;
    private final UserMapper mapper = UserMapper.INSTANCE;

    public UserDTO getUser(Long id) {
        return userRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public User getByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setRecentActivity(new Date(System.currentTimeMillis()));
            userRepository.save(user);
        }
        return user;
    }

    public boolean authenticate(AuthDTO loginDTO) {
        emailValidation(loginDTO.getEmail());
        passwordValidation(loginDTO.getPassword());

        User user = userRepository.findByEmail(loginDTO.getEmail());
        if (user != null) {
            return passwordEncoder.matches(loginDTO.getPassword(), user.getPassword());
        }
        return false;
    }

    public List<Map<String, Object>> getInactiveUsers() {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.YEAR, -5);
        Date fiveYearsAgoDate = new Date(calendar.getTimeInMillis());

        List<User> inactiveUsers = userRepository.findByRecentActivityBefore(fiveYearsAgoDate);

        List<Map<String, Object>> results = new ArrayList<>();

        for (User user : inactiveUsers) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("recentActivity", user.getRecentActivity());
            userData.put("role", user.getRole());

            results.add(userData);
        }

        return results;
    }

    public List<Map<String, Object>> getUsersByFlightId(Long flightId, Long idFromToken) {
        Flight flight = flightRepository.findById(flightId).orElse(null);
        List<Map<String, Object>> response = new ArrayList<>();

        if (flight == null) {
            return List.of();
        }

        Long aviaId = flight.getAvia_id();

        if (!Objects.equals(aviaId, idFromToken))
            throw new IllegalArgumentException("User ID does not match");

        // Знайдемо всі замовлення для заданого flight_id
        List<Order> orders = orderRepository.findByFlight_id(flightId);

        // Отримаємо унікальні user_id з цих замовлень
        List<Long> userIds = orders.stream()
                .map(Order::getClient_id) // Отримуємо client_id для кожного замовлення
                .distinct() // Робимо їх унікальними
                .collect(Collectors.toList());

        // Знайдемо користувачів за user_id
        List<User> users = userRepository.findAllById(userIds);

        // Завантажуємо бонуси
        List<Bonus> bonuses = bonusRepository.findByUserIdsAndAviaId(userIds, aviaId);

        // Переводимо в map
        Map<Long, Long> bonusMap = bonuses.stream()
                .collect(Collectors.toMap(Bonus::getClient_id, Bonus::getBonus_count));

        // Формуємо результат
        for (User user : users) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("bonus_count", bonusMap.getOrDefault(user.getId(), 0L));
            response.add(userData);
        }

        return response;
    }

    public List<Map<String, Object>> getUsersByAviaId(Long id) {

        List<Flight> flights = flightRepository.findByAviaId(id);
        if (flights.isEmpty()) {
            return List.of();
        }

        List<Long> flightIds = flights.stream()
                .map(Flight::getId)
                .collect(Collectors.toList());

        List<Order> orders = new ArrayList<>();
        for (Long fid : flightIds) {
            if (fid == null) continue;
            List<Order> ordersForFlight = orderRepository.findByFlight_id(fid);
            if (ordersForFlight != null && !ordersForFlight.isEmpty())
                orders.addAll(ordersForFlight);
        }

        List<Long> userIds = orders.stream()
                .map(Order::getClient_id)
                .distinct()
                .collect(Collectors.toList());

        if (userIds.isEmpty()) {
            return List.of();
        }

        List<User> users = userRepository.findAllById(userIds);

        List<Bonus> bonuses = bonusRepository.findByUserIdsAndAviaId(userIds, id);
        Map<Long, Long> bonusMap = bonuses.stream()
                .collect(Collectors.toMap(Bonus::getClient_id, Bonus::getBonus_count));

        List<Map<String, Object>> response = new ArrayList<>();

        for (User user : users) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("bonus_count", bonusMap.getOrDefault(user.getId(), 0L));
            response.add(userData);
        }

        return response;
    }

    public Map<String, Object> createUser(UserDTO userDTO) {
        nameValidation(userDTO.getName());
        emailValidation(userDTO.getEmail());
        phoneNumberValidation(userDTO.getPhoneNumber());
        passwordValidation(userDTO.getPassword());

        if (containsHtml(userDTO.getRole())) {
            throw new IllegalArgumentException("Role cannot contain HTML tags.");
        }

        if (userRepository.findByEmail(userDTO.getEmail()) != null)
            throw new IllegalArgumentException("A user with this email address already exists!");
        if (userRepository.findByPhoneNumber(userDTO.getPhoneNumber()) != null)
            throw new IllegalArgumentException("A user with this phone number already exists!");

        switch (userDTO.getRole()) {
            case "CLIENT":
            case "AVIA-temp":
                break;
            default:
                throw new IllegalArgumentException("Invalid role!");
        }

        String encodedPassword = passwordEncoder.encode(userDTO.getPassword());

        userDTO.setName(userDTO.getName());
        userDTO.setEmail(userDTO.getEmail());
        userDTO.setPhoneNumber(userDTO.getPhoneNumber());
        userDTO.setPassword(encodedPassword);
        userDTO.setRecentActivity(new Date(System.currentTimeMillis()));

        User user = mapper.toEntity(userDTO);
        user = userRepository.save(user);

        String token = JwtUtil.generate(user.getEmail(), user.getRole(), user.getName(), Math.toIntExact(user.getId()));

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);

        Map<String, Object> userData = new HashMap<>();
        result.put("user", userData);
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phoneNumber", user.getPhoneNumber());
        userData.put("role", user.getRole());

        return result;
    }

    public Map<String, Object> updateUser(Long id, UserDTO userDTO) {
        if (userDTO.getName() != null) {
            nameValidation(userDTO.getName());
        }
        if (userDTO.getEmail() != null) {
            emailValidation(userDTO.getEmail());
        }
        if (userDTO.getPhoneNumber() != null) {
            phoneNumberValidation(userDTO.getPhoneNumber());
        }
        if (userDTO.getPassword() != null) {
            passwordValidation(userDTO.getPassword());
        }

        User existingUser = userRepository.findById(id).orElse(null);
        Map<String, Object> response = new HashMap<>();

        if (existingUser == null) {
            response.put("message", "No user with that ID '" + id + "' found.");
            return response;
        }

        if (userRepository.findByEmail(userDTO.getEmail()) != null && !existingUser.getEmail().equals(userDTO.getEmail())) {
            throw new IllegalArgumentException("A user with this email address already exists!");
        }
        if (userRepository.findByPhoneNumber(userDTO.getPhoneNumber()) != null && !existingUser.getPhoneNumber().equals(userDTO.getPhoneNumber())) {
            throw new IllegalArgumentException("A user with this phone number already exists!");
        }

        if (userDTO.getName() != null) {
            existingUser.setName(userDTO.getName());
        }
        if (userDTO.getEmail() != null) {
            existingUser.setEmail(userDTO.getEmail());
        }
        if (userDTO.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(userDTO.getPhoneNumber());
        }
        if (userDTO.getPassword() != null) {
            String encodedPassword = passwordEncoder.encode(userDTO.getPassword());
            existingUser.setPassword(encodedPassword);
        }
        if (userDTO.getRecentActivity() != null) {
            existingUser.setRecentActivity(userDTO.getRecentActivity());
        }

        User updatedUser = userRepository.save(existingUser);
        mapper.toDTO(updatedUser);

        String token = JwtUtil.generate(
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getName(),
                Math.toIntExact(updatedUser.getId()));

        response.put("token", token);

        Map<String, Object> userData = new HashMap<>();
        response.put("user", userData);
        userData.put("id", updatedUser.getId());
        userData.put("name", updatedUser.getName());
        userData.put("email", updatedUser.getEmail());
        userData.put("phoneNumber", updatedUser.getPhoneNumber());
        userData.put("role", updatedUser.getRole());

        return response;
    }

    public Map<String, Object> softDeleteUser(Long id) {
        User existingUser = userRepository.findById(id).orElse(null);
        Map<String, Object> response = new HashMap<>();

        if (existingUser == null) {
            response.put("status", HttpStatus.NOT_FOUND.value());
            response.put("message", "No user with that ID '" + id + "' found.");
            return response;
        } else if (existingUser.is_deleted()) {
            response.put("status", HttpStatus.BAD_REQUEST.value());
            response.put("message", "Flight with ID '" + id + "' already deactivated");
            return response;
        }

        existingUser.set_deleted(true);

        userRepository.save(existingUser);

        response.put("status", HttpStatus.OK.value());
        response.put("message", "User '" + existingUser.getEmail() + "' successfully deactivated");

        return response;
    }

    private boolean containsHtml(String input) {
        return input != null && input.matches(".*<[^>]+>.*");
    }

    private void nameValidation(String name) {
        if (containsHtml(name)) {
            throw new IllegalArgumentException("Name cannot contain HTML tags.");
        }
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Name cannot be empty");
        if (name.length() > 201)
            throw new IllegalArgumentException("Name cannot exceed 201 characters");
    }

    private void emailValidation(String email) {
        if (containsHtml(email)) {
            throw new IllegalArgumentException("Email cannot contain HTML tags.");
        }
        if (email == null || email.isBlank())
            throw new IllegalArgumentException("Email cannot be empty");
        if (email.length() > 100)
            throw new IllegalArgumentException("Email cannot exceed 100 characters");
        if (email.contains(" "))
            throw new IllegalArgumentException("Email cannot contain spaces");
        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"))
            throw new IllegalArgumentException("Invalid email format");
    }

    private void phoneNumberValidation(String phoneNumber) {
        if (containsHtml(phoneNumber)) {
            throw new IllegalArgumentException("Phone number cannot contain HTML tags.");
        }
        if (phoneNumber == null || phoneNumber.isBlank())
            throw new IllegalArgumentException("Phone number cannot be empty");
        if (phoneNumber.length() > 15)
            throw new IllegalArgumentException("Phone number cannot exceed 15 characters");
        if (!phoneNumber.matches("^\\+?[0-9]+$"))
            throw new IllegalArgumentException("Phone number can contain only digits and '+'");
    }

    private void passwordValidation(String password) {
        if (containsHtml(password)) {
            throw new IllegalArgumentException("Password cannot contain HTML tags.");
        }
        if (password == null || password.isBlank())
            throw new IllegalArgumentException("Password cannot be empty");
        if (password.length() < 6 || password.length() > 100)
            throw new IllegalArgumentException("Password must be 6–100 characters long");
        if (!password.matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=<>?]{6,100}$"))
            throw new IllegalArgumentException("Password must contain uppercase, lowercase, and a digit");
    }
}