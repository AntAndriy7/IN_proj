package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.*;
import com.example.in_proj.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.in_proj.services.OrderService;

import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.itextpdf.text.pdf.draw.LineSeparator;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.http.MediaType;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/download")
@RequiredArgsConstructor
public class DownloadController {

    private final OrderService orderService;
    private final UserService userService;

    @GetMapping("/{orderId}")
    public ResponseEntity<byte[]> downloadTicket(@PathVariable Long orderId, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");

            Map<String, Object> orderData = orderService.getOrderById(orderId);
            if (orderData == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(("Order not found.").getBytes());
            }

            OrderDTO orderDTO = (OrderDTO) orderData.get("order");

            if (!Objects.equals(orderDTO.getClient_id(), JwtUtil.getId(token))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(("User ID does not match.").getBytes());
            }

            UserDTO user = userService.getUser(orderDTO.getClient_id());

            List<TicketDTO> tickets = (List<TicketDTO>) orderData.get("tickets");
            Map<String, Object> flightData = (Map<String, Object>) orderData.get("flightData");

            FlightDTO flight = ((List<FlightDTO>) flightData.get("flights")).get(0);

            String planeModel = (String) ((List<Map<String, Object>>) flightData.get("planes")).get(0).get("model");

            Map<String, Object> airline = ((List<Map<String, Object>>) flightData.get("airlines")).get(0);

            List<Map<String, Object>> airportMaps = (List<Map<String, Object>>) flightData.get("airports");

            List<AirportDTO> airports = airportMaps.stream()
                    .map(map -> {
                        AirportDTO dto = new AirportDTO();

                        Object idObj = map.get("id");
                        if (idObj instanceof Integer) {
                            dto.setId(((Integer) idObj).longValue());
                        } else if (idObj instanceof Long) {
                            dto.setId((Long) idObj);
                        }

                        dto.setName((String) map.get("name"));
                        dto.setCity((String) map.get("city"));
                        dto.setCode((String) map.get("code"));
                        dto.setCountry((String) map.get("country"));
                        return dto;
                    })
                    .collect(Collectors.toList());

            AirportDTO departureAirport = airports.stream()
                    .filter(a -> Objects.equals(a.getId(), flight.getDeparture_id()))
                    .findFirst()
                    .orElse(null);

            AirportDTO destinationAirport = airports.stream()
                    .filter(a -> Objects.equals(a.getId(), flight.getDestination_id()))
                    .findFirst()
                    .orElse(null);

            if (departureAirport == null || destinationAirport == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Airport data not found".getBytes());
            }

            String fromAirport = departureAirport.getCity() + " (" + departureAirport.getCode() + ")";

            String toAirport = destinationAirport.getCity() + " (" + destinationAirport.getCode() + ")";

            DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy  |  HH:mm");

            LocalDate departureDate = flight.getDeparture_date().toLocalDate();
            LocalDate arrivalDate = flight.getArrival_date().toLocalDate();

            LocalTime departureTime = flight.getDeparture_time().toLocalTime();
            LocalTime arrivalTime = flight.getArrival_time().toLocalTime();

            LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
            LocalDateTime arrivalDateTime = LocalDateTime.of(arrivalDate, arrivalTime);

            String departureFormatted = departureDateTime.format(displayFormatter);
            String arrivalFormatted = arrivalDateTime.format(displayFormatter);

            Duration flightDuration = Duration.between(departureDateTime, arrivalDateTime);
            long hours = flightDuration.toHours();
            long minutes = flightDuration.toMinutesPart();
            String flightDurationFormatted = String.format("%dh %02dm", hours, minutes);

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // ==== КОЛЬОРИ ====
            BaseColor primaryColor = new BaseColor(0, 0, 0);
            BaseColor accentColor = new BaseColor(41, 128, 185);
            BaseColor lightGray = new BaseColor(248, 249, 250);
            BaseColor darkGray = new BaseColor(52, 58, 64);
            BaseColor borderColor = new BaseColor(222, 226, 230);
            BaseColor successGreen = new BaseColor(40, 167, 69);

            // ==== ШРИФТИ ====
            Font subHeaderFont = new Font(Font.FontFamily.HELVETICA, 16, Font.NORMAL, darkGray);
            Font sectionTitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, accentColor);
            Font labelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, darkGray);
            Font valueFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, primaryColor);
            Font tableValueFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, primaryColor);
            Font statusPaidFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, successGreen);

            // ==== ХЕДЕР З ЛОГОТИПОМ ====
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);
            headerTable.setSpacingAfter(25f);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setBackgroundColor(lightGray);
            headerCell.setPadding(25);
            headerCell.setPaddingTop(20);
            headerCell.setPaddingBottom(20);

            // Логотип - використовуємо просто текст, оскільки іконки не працюють
            Paragraph logo = new Paragraph("KYIV INTERNATIONAL AIRPORT",
                    new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, accentColor));
            logo.setAlignment(Element.ALIGN_CENTER);
            logo.setSpacingAfter(8f);

            Paragraph subTitle = new Paragraph("E-Ticket Confirmation", subHeaderFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);

            headerCell.addElement(logo);
            headerCell.addElement(subTitle);
            headerTable.addCell(headerCell);

            document.add(headerTable);

            // ==== ІНФОРМАЦІЯ ПРО ЗАМОВЛЕННЯ ====
            PdfPTable orderInfoTable = new PdfPTable(2);
            orderInfoTable.setWidthPercentage(100);
            orderInfoTable.setSpacingAfter(20f);
            orderInfoTable.setWidths(new float[]{1, 1});

            addCompactInfoCell(orderInfoTable, "Order Number", "#" + orderId, labelFont, valueFont, borderColor);
            addCompactInfoCell(orderInfoTable, "Generated", LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")), labelFont, valueFont, borderColor);

            document.add(orderInfoTable);

            // ==== ІНФОРМАЦІЯ ПРО РЕЙС ====
            addSectionTitle(document, "Flight Information", sectionTitleFont);

            PdfPTable flightTable = new PdfPTable(2);
            flightTable.setWidthPercentage(100);
            flightTable.setSpacingBefore(10f);
            flightTable.setSpacingAfter(20f);
            flightTable.setWidths(new float[]{1, 1});

            addStyledInfoCell(flightTable, "Aircraft", planeModel, labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "Airline", (String) airline.get("name"), labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "From", fromAirport, labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "To", toAirport, labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "Departure", departureFormatted, labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "Arrival", arrivalFormatted, labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "Ticket Price", flight.getTicket_price() + " UAH", labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(flightTable, "Flight Duration", flightDurationFormatted, labelFont, valueFont, lightGray, borderColor);

            document.add(flightTable);

            // ==== ІНФОРМАЦІЯ ПРО КЛІЄНТА ====
            addSectionTitle(document, "Order Information", sectionTitleFont);

            PdfPTable clientTable = new PdfPTable(2);
            clientTable.setWidthPercentage(100);
            clientTable.setSpacingBefore(10f);
            clientTable.setSpacingAfter(20f);
            clientTable.setWidths(new float[]{1, 1});

            addStyledInfoCell(clientTable, "Full Name", user.getName(), labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(clientTable, "Email", user.getEmail(), labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(clientTable, "Phone", user.getPhoneNumber(), labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(clientTable, "Total Tickets", Long.toString(orderDTO.getTicket_quantity()), labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCell(clientTable, "Total Price", orderDTO.getTotal_price() + " UAH", labelFont, valueFont, lightGray, borderColor);
            addStyledInfoCellCustomValue(clientTable, "Payment Status", "PAID", labelFont, statusPaidFont, lightGray, borderColor);

            document.add(clientTable);

            // ==== РОЗРИВ СТОРІНКИ ====
            document.newPage();

            // ==== СПИСОК ПАСАЖИРІВ ====
            addSectionTitle(document, "Passenger List", sectionTitleFont);

            PdfPTable passTable = new PdfPTable(4);
            passTable.setWidthPercentage(100);
            passTable.setSpacingBefore(10f);
            passTable.setSpacingAfter(20f);
            passTable.setWidths(new float[]{0.6f, 2.5f, 1f, 2f});

            addPassengerTableHeader(passTable, new String[]{"#", "Passenger Name", "Age", "Seat Number"}, accentColor);
            for (int i = 0; i < tickets.size(); i++) {
                TicketDTO ticket = tickets.get(i);
                if (i % 2 == 0) {
                    addPassengerTableRow(passTable, new String[]{Long.toString(i + 1), ticket.getName(), ticket.isAdult() ? "Adult" : "Child", "To be assigned at check-in"}, tableValueFont, BaseColor.WHITE, borderColor);
                } else {
                    addPassengerTableRow(passTable, new String[]{Long.toString(i + 1), ticket.getName(), ticket.isAdult() ? "Adult" : "Child", "To be assigned at check-in"}, tableValueFont, lightGray, borderColor);
                }
            }

            document.add(passTable);

            // ==== ДОДАТКОВА ІНФОРМАЦІЯ ====
            addSectionTitle(document, "Important Information", sectionTitleFont);

            PdfPTable infoBox = new PdfPTable(1);
            infoBox.setWidthPercentage(100);
            infoBox.setSpacingBefore(10f);
            infoBox.setSpacingAfter(20f);

            PdfPCell infoCell = new PdfPCell();
            infoCell.setBackgroundColor(new BaseColor(255, 249, 240)); // Світло-помаранчевий фон
            infoCell.setPadding(18);
            infoCell.setBorder(Rectangle.BOX);
            infoCell.setBorderColor(new BaseColor(255, 193, 7));
            infoCell.setBorderWidth(1f);

            Font infoTextFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, darkGray);
            Font bulletFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(255, 152, 0));

            Paragraph infoPara = new Paragraph();
            infoPara.setLeading(16f);

            addBulletPoint(infoPara, "Please arrive at the airport at least 2 hours before departure.", bulletFont, infoTextFont);
            addBulletPoint(infoPara, "Remember to bring your passport or ID card.", bulletFont, infoTextFont);
            addBulletPoint(infoPara, "Online check-in opens 24 hours before the flight.", bulletFont, infoTextFont);
            addBulletPoint(infoPara, "Boarding gates close 30 minutes before departure.", bulletFont, infoTextFont);

            Paragraph contactInfo = new Paragraph();
            contactInfo.add(new Chunk("• ", bulletFont));
            contactInfo.add(new Chunk("For customer support: ", infoTextFont));
            contactInfo.add(new Chunk("0 800 500 556", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, accentColor)));

            infoPara.add(contactInfo);

            infoCell.addElement(infoPara);
            infoBox.addCell(infoCell);
            document.add(infoBox);

            // ==== ФУТЕР ====
            document.add(new Paragraph(" "));

            LineSeparator line = new LineSeparator();
            line.setLineColor(accentColor);
            line.setLineWidth(2f);
            document.add(line);

            document.add(new Paragraph(" "));

            Paragraph thanks = new Paragraph("Thank you for flying with " + airline.get("name") + "!",
                    new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, accentColor));
            thanks.setAlignment(Element.ALIGN_CENTER);
            thanks.setSpacingAfter(5f);
            document.add(thanks);

            Paragraph wishes = new Paragraph("We wish you a comfortable and safe journey.",
                    new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, darkGray));
            wishes.setAlignment(Element.ALIGN_CENTER);
            document.add(wishes);

            document.close();

            byte[] pdfBytes = out.toByteArray();
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=KIA_order_" + orderId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.internalServerError()
                    .body(("Error generating PDF: " + errorMessage).getBytes());
        }
    }

    private void addSectionTitle(Document document, String title, Font font) throws DocumentException {
        Paragraph section = new Paragraph(title, font);
        section.setSpacingBefore(5f);
        section.setSpacingAfter(3f);
        document.add(section);
    }

    private void addBulletPoint(Paragraph para, String text, Font bulletFont, Font textFont) {
        para.add(new Chunk("• ", bulletFont));
        para.add(new Chunk(text + "\n", textFont));
    }

    private void addCompactInfoCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont, BaseColor borderColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(borderColor);
        cell.setBorderWidth(1f);
        cell.setPadding(10);
        cell.setPaddingBottom(8);

        Paragraph content = new Paragraph();
        content.add(new Chunk(label + "\n", labelFont));
        content.add(new Chunk(value, valueFont));

        cell.addElement(content);
        table.addCell(cell);
    }

    private void addStyledInfoCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont, BaseColor bgColor, BaseColor borderColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(borderColor);
        cell.setBorderWidth(0.5f);
        cell.setPadding(12);
        cell.setPaddingTop(10);
        cell.setPaddingBottom(10);

        Paragraph content = new Paragraph();
        content.add(new Chunk(label + "\n", labelFont));
        content.add(new Chunk(value, valueFont));

        cell.addElement(content);
        table.addCell(cell);
    }

    private void addStyledInfoCellCustomValue(PdfPTable table, String label, String value, Font labelFont, Font valueFont, BaseColor bgColor, BaseColor borderColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(borderColor);
        cell.setBorderWidth(0.5f);
        cell.setPadding(12);
        cell.setPaddingTop(10);
        cell.setPaddingBottom(10);

        Paragraph content = new Paragraph();
        content.add(new Chunk(label + "\n", labelFont));
        content.add(new Chunk(value, valueFont));

        cell.addElement(content);
        table.addCell(cell);
    }

    private void addPassengerTableHeader(PdfPTable table, String[] headers, BaseColor bgColor) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell();
            cell.setBackgroundColor(bgColor);
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(12);
            cell.setBorder(Rectangle.NO_BORDER);
            cell.setPhrase(new Phrase(header, new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
            table.addCell(cell);
        }
    }

    private void addPassengerTableRow(PdfPTable table, String[] cells, Font font, BaseColor bgColor, BaseColor borderColor) {
        for (int i = 0; i < cells.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(cells[i], font));
            cell.setHorizontalAlignment(i == 0 ? Element.ALIGN_CENTER : Element.ALIGN_LEFT);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(10);
            cell.setBackgroundColor(bgColor);
            cell.setBorder(Rectangle.BOTTOM);
            cell.setBorderColor(borderColor);
            cell.setBorderWidth(0.5f);
            table.addCell(cell);
        }
    }
}
