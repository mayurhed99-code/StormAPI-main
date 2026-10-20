package com.ravitej.stormapi.execution.repo;

import com.ravitej.stormapi.execution.model.TestConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TestConfigRepository extends JpaRepository<TestConfig, Long> {

    @Query("""
            select c from TestConfig c
            where c.apiTargetId in (select t.id from ApiTarget t where t.userId = :userId)
            order by c.createdAt desc
            """)
    List<TestConfig> findAllForUser(@Param("userId") Long userId);
}
