-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: rumyroommate
-- ------------------------------------------------------
-- Server version	8.4.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `userpreferences`
--

DROP TABLE IF EXISTS `userpreferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userpreferences` (
  `userid` int unsigned NOT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `prefrace` varchar(255) DEFAULT NULL,
  `prefreligion` varchar(255) DEFAULT NULL,
  `prefsmoking` varchar(255) DEFAULT NULL,
  `prefdrinking` varchar(255) DEFAULT NULL,
  `sleephabits` varchar(255) DEFAULT NULL,
  `sleepstarttime` time DEFAULT NULL,
  `sleependtime` time DEFAULT NULL,
  `studystarttime` time DEFAULT NULL,
  `studyendtime` time DEFAULT NULL,
  `sharedstarttime` time DEFAULT NULL,
  `sharedendtime` time DEFAULT NULL,
  `roombudget` int unsigned DEFAULT NULL,
  `preflowtemp` int DEFAULT NULL,
  `prefhightemp` int DEFAULT NULL,
  `prefguestfreq` int unsigned DEFAULT NULL,
  `cleanliness` int unsigned DEFAULT NULL,
  `noisetolerance` int unsigned DEFAULT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `userid_UNIQUE` (`userid`),
  CONSTRAINT `fk_userid_pref` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`),
  CONSTRAINT `chk_cleanliness` CHECK (((`cleanliness` >= 1) and (`cleanliness` <= 10))),
  CONSTRAINT `chk_gender` CHECK ((`gender` in (_utf8mb4'M',_utf8mb4'F',_utf8mb4'O',_utf8mb4'N'))),
  CONSTRAINT `chk_noisetolerance` CHECK (((`noisetolerance` >= 1) and (`noisetolerance` <= 10))),
  CONSTRAINT `chk_prefdrinking` CHECK ((`prefdrinking` in (_utf8mb4'Y',_utf8mb4'N',_utf8mb4'D'))),
  CONSTRAINT `chk_prefsmoking` CHECK ((`prefsmoking` in (_utf8mb4'Y',_utf8mb4'N',_utf8mb4'D')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-08 20:44:23
