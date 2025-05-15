package com.capstone.back.dto;

import java.util.List;

public class CollectRequest {
    private String action;
    private List<List<Double>> sequence;

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public List<List<Double>> getSequence() {
        return sequence;
    }

    public void setSequence(List<List<Double>> sequence) {
        this.sequence = sequence;
    }
}
