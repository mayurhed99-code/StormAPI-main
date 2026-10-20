package com.ravitej.stormapi.report.repo;

import com.ravitej.stormapi.report.model.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    List<TestRun> findByStatus(String status);
}
