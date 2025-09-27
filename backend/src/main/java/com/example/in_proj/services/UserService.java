package com.example.in_proj.services;

import com.example.in_proj.dto.UserDTO;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.User;
import com.example.in_proj.mapper.UserMapper;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.Calendar;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final UserMapper mapper = UserMapper.INSTANCE;

    public UserDTO getUser(Long id) {
        return userRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getInactiveUsers() {
        // Обчислення дати 5 років тому за допомогою Calendar
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.YEAR, -5);
        Date fiveYearsAgoDate = new Date(calendar.getTimeInMillis());

        List<User> inactiveUsers = userRepository.findByRecentActivityBefore(fiveYearsAgoDate);
        return inactiveUsers.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<User> getUsersByPlaneId(Long planeId) {
        // Знайдемо всі замовлення для заданого plane_id
        List<Order> orders = orderRepository.findByPlane_id(planeId);

        // Отримаємо унікальні user_id з цих замовлень
        List<Long> userIds = orders.stream()
                .map(Order::getClient_id) // Отримуємо client_id для кожного замовлення
                .distinct() // Робимо їх унікальними
                .collect(Collectors.toList());

        // Знайдемо користувачів за user_id
        return userRepository.findAllById(userIds);
    }

    public UserDTO createUser(UserDTO userDTO) {
        String encodedPassword = passwordEncoder.encode(userDTO.getPassword());
        userDTO.setPassword(encodedPassword);

        userDTO.setRecentActivity(new Date(System.currentTimeMillis()));

        User user = mapper.toEntity(userDTO);

        user = userRepository.save(user);
        return mapper.toDTO(user);
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        return userRepository.findById(id).map(existingUser -> {
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
                existingUser.setPassword(userDTO.getPassword());
            }
            if (userDTO.getRecentActivity() != null) {
                existingUser.setRecentActivity(userDTO.getRecentActivity());
            }

            userRepository.save(existingUser);
            return mapper.toDTO(existingUser);
        }).orElse(null);
    }

    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}